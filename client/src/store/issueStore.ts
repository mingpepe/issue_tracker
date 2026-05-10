import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { Issue, Level } from '../types';

const API_URL = 'http://localhost:3001/api/issues';

export const useIssueStore = defineStore('issue', () => {
  const issues = ref<Issue[]>([]);
  const loading = ref(false);
  const selectedIds = ref<Set<string>>(new Set());

  async function fetchIssues() {
    loading.value = true;
    try {
      const response = await axios.get<Issue[]>(API_URL);
      issues.value = response.data;
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      loading.value = false;
    }
  }

  async function syncIssues() {
    try {
      await axios.post(API_URL, issues.value);
    } catch (error) {
      console.error('Failed to sync issues:', error);
    }
  }

  function addIssue(parentId: string | null, title: string, importance: Level, urgency: Level, description?: string) {
    const parentList = parentId === null 
      ? issues.value 
      : findIssueById(issues.value, parentId)?.children;

    const newIssue: Issue = {
      id: uuidv4(),
      title,
      description,
      importance,
      urgency,
      children: [],
      createdAt: Date.now(),
      completed: false,
      order: parentList ? parentList.length : 0,
    };

    if (parentId === null) {
      issues.value.push(newIssue);
    } else {
      const parent = findIssueById(issues.value, parentId);
      if (parent) {
        parent.children.push(newIssue);
      }
    }
    syncIssues();
  }

  function toggleIssueComplete(id: string) {
    const issue = findIssueById(issues.value, id);
    if (issue) {
      issue.completed = !issue.completed;
      syncIssues();
    }
  }

  function updateIssue(id: string, updates: Partial<Omit<Issue, 'id' | 'children' | 'createdAt'>>) {
    const issue = findIssueById(issues.value, id);
    if (issue) {
      Object.assign(issue, updates);
      syncIssues();
    }
  }

  function deleteIssue(id: string) {
    const removeRecursive = (list: Issue[], id: string): boolean => {
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list.splice(index, 1);
        return true;
      }
      for (const item of list) {
        if (removeRecursive(item.children, id)) return true;
      }
      return false;
    };

    removeRecursive(issues.value, id);
    selectedIds.value.delete(id);
    syncIssues();
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds.value);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    selectedIds.value = newSelected;
  }

  function clearSelection() {
    selectedIds.value = new Set();
  }

  function bulkDelete() {
    const idsToRemove = Array.from(selectedIds.value);
    idsToRemove.forEach(id => {
      const removeRecursive = (list: Issue[], targetId: string): boolean => {
        const index = list.findIndex(item => item.id === targetId);
        if (index !== -1) {
          list.splice(index, 1);
          return true;
        }
        for (const item of list) {
          if (removeRecursive(item.children, targetId)) return true;
        }
        return false;
      };
      removeRecursive(issues.value, id);
    });
    selectedIds.value = new Set();
    syncIssues();
  }

  function findIssueById(list: Issue[], id: string): Issue | undefined {
    for (const item of list) {
      if (item.id === id) return item;
      const found = findIssueById(item.children, id);
      if (found) return found;
    }
    return undefined;
  }

  function getFlattenedIssues(list: Issue[]): Array<{ id: string; title: string }> {
    let result: Array<{ id: string; title: string }> = [];
    for (const item of list) {
      result.push({ id: item.id, title: item.title });
      if (item.children.length > 0) {
        result = result.concat(getFlattenedIssues(item.children));
      }
    }
    return result;
  }

  return {
    issues,
    loading,
    selectedIds,
    fetchIssues,
    addIssue,
    updateIssue,
    deleteIssue,
    toggleIssueComplete,
    syncIssues,
    toggleSelection,
    clearSelection,
    bulkDelete,
    getFlattenedIssues: () => getFlattenedIssues(issues.value),
  };
});
