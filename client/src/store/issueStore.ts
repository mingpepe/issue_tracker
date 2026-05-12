import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { Issue, Level, Tab } from '../types';

const API_URL = 'http://localhost:3001/api/issues';

export const useIssueStore = defineStore('issue', () => {
  const tabs = ref<Tab[]>([
    { id: 'default', name: 'Main', issues: [] }
  ]);
  const trash = ref<Issue[]>([]);
  const workspaceIds = ref<string[]>([]);
  const activeTabId = ref('default');
  const loading = ref(false);
  const selectedIds = ref<Set<string>>(new Set());
  const showDone = ref(false);
  const draggingIssueId = ref<string | null>(null);

  const activeTab = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value) || tabs.value[0];
  });

  const issues = computed({
    get: () => activeTab.value.issues,
    set: (newIssues) => {
      const tab = activeTab.value;
      if (tab) tab.issues = newIssues;
    }
  });

  const workspaceIssues = computed(() => {
    return workspaceIds.value
      .map(id => findIssueByIdInAllTabs(id))
      .filter((issue): issue is Issue => !!issue);
  });

  async function fetchIssues() {
    loading.value = true;
    try {
      const response = await axios.get<any>(API_URL);
      const data = response.data;
      
      // Migration/Loading logic
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // New structure with tabs and trash
        tabs.value = data.tabs || [{ id: 'default', name: 'Main', issues: [] }];
        trash.value = data.trash || [];
        workspaceIds.value = data.workspaceIds || [];
      } else if (Array.isArray(data)) {
        // Migration from old array-only format
        if (data.length > 0 && 'id' in data[0] && !('issues' in data[0])) {
          tabs.value = [{ id: 'default', name: 'Main', issues: data }];
        } else if (data.length > 0 && 'issues' in data[0]) {
          tabs.value = data;
        } else {
          tabs.value = [{ id: 'default', name: 'Main', issues: [] }];
        }
        trash.value = [];
        workspaceIds.value = [];
      }
      
      if (tabs.value.length > 0 && !tabs.value.find(t => t.id === activeTabId.value)) {
        activeTabId.value = tabs.value[0].id;
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      loading.value = false;
    }
  }

  async function syncIssues() {
    try {
      await axios.post(API_URL, {
        tabs: tabs.value,
        trash: trash.value,
        workspaceIds: workspaceIds.value
      });
    } catch (error) {
      console.error('Failed to sync issues:', error);
    }
  }

  function addTab(name: string) {
    const newTab: Tab = {
      id: uuidv4(),
      name,
      issues: []
    };
    tabs.value.push(newTab);
    activeTabId.value = newTab.id;
    syncIssues();
  }

  function renameTab(id: string, newName: string) {
    const tab = tabs.value.find(t => t.id === id);
    if (tab) {
      tab.name = newName;
      syncIssues();
    }
  }

  function deleteTab(id: string) {
    if (tabs.value.length <= 1) return;
    const index = tabs.value.findIndex(t => t.id === id);
    if (index !== -1) {
      const deletedTab = tabs.value.splice(index, 1)[0];
      // Move tab issues to trash
      trash.value.push(...deletedTab.issues);
      if (activeTabId.value === id) {
        activeTabId.value = tabs.value[0].id;
      }
      syncIssues();
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
    const issue = findIssueByIdInAllTabs(id);
    if (issue) {
      issue.completed = !issue.completed;
      syncIssues();
    }
  }

  function updateIssue(id: string, updates: Partial<Omit<Issue, 'id' | 'children' | 'createdAt'>>) {
    const issue = findIssueByIdInAllTabs(id);
    if (issue) {
      Object.assign(issue, updates);
      syncIssues();
    }
  }

  function deleteIssue(id: string) {
    const removeRecursive = (list: Issue[], targetId: string): Issue | undefined => {
      const index = list.findIndex(item => item.id === targetId);
      if (index !== -1) {
        return list.splice(index, 1)[0];
      }
      for (const item of list) {
        const found = removeRecursive(item.children, targetId);
        if (found) return found;
      }
      return undefined;
    };

    let movedIssue: Issue | undefined;
    for (const tab of tabs.value) {
      movedIssue = removeRecursive(tab.issues, id);
      if (movedIssue) break;
    }
    
    if (movedIssue) {
      trash.value.push(movedIssue);
    }
    
    selectedIds.value.delete(id);
    removeFromWorkspace(id);
    syncIssues();
  }

  function restoreIssue(id: string) {
    const index = trash.value.findIndex(item => item.id === id);
    if (index !== -1) {
      const restored = trash.value.splice(index, 1)[0];
      issues.value.push(restored);
      syncIssues();
    }
  }

  function permanentlyDeleteIssue(id: string) {
    const index = trash.value.findIndex(item => item.id === id);
    if (index !== -1) {
      trash.value.splice(index, 1);
      syncIssues();
    }
  }

  function emptyTrash() {
    trash.value = [];
    syncIssues();
  }

  function moveIssueToTab(issueId: string, targetTabId: string) {
    let targetIssue: Issue | undefined;
    for (const tab of tabs.value) {
      const removeAndReturn = (list: Issue[], id: string): Issue | undefined => {
        const index = list.findIndex(item => item.id === id);
        if (index !== -1) {
          return list.splice(index, 1)[0];
        }
        for (const item of list) {
          const found = removeAndReturn(item.children, id);
          if (found) return found;
        }
        return undefined;
      };
      targetIssue = removeAndReturn(tab.issues, issueId);
      if (targetIssue) break;
    }

    if (targetIssue) {
      const targetTab = tabs.value.find(t => t.id === targetTabId);
      if (targetTab) {
        targetIssue.order = targetTab.issues.length;
        targetTab.issues.push(targetIssue);
        syncIssues();
      }
    }
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
    idsToRemove.forEach(id => deleteIssue(id));
    selectedIds.value = new Set();
    syncIssues();
  }

  function addToWorkspace(ids: string[]) {
    const newIds = ids.filter(id => !workspaceIds.value.includes(id));
    workspaceIds.value.push(...newIds);
    syncIssues();
  }

  function removeFromWorkspace(id: string) {
    const index = workspaceIds.value.indexOf(id);
    if (index !== -1) {
      workspaceIds.value.splice(index, 1);
      syncIssues();
    }
  }

  function clearWorkspace() {
    workspaceIds.value = [];
    syncIssues();
  }

  function reorderWorkspace(oldIndex: number, newIndex: number) {
    const movedId = workspaceIds.value.splice(oldIndex, 1)[0];
    workspaceIds.value.splice(newIndex, 0, movedId);
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

  function findIssueByIdInAllTabs(id: string): Issue | undefined {
    for (const tab of tabs.value) {
      const found = findIssueById(tab.issues, id);
      if (found) return found;
    }
    return undefined;
  }

  return {
    tabs,
    trash,
    workspaceIds,
    workspaceIssues,
    activeTabId,
    issues,
    loading,
    selectedIds,
    showDone,
    fetchIssues,
    addTab,
    renameTab,
    deleteTab,
    addIssue,
    updateIssue,
    deleteIssue,
    restoreIssue,
    permanentlyDeleteIssue,
    emptyTrash,
    moveIssueToTab,
    toggleIssueComplete,
    syncIssues,
    toggleSelection,
    clearSelection,
    bulkDelete,
    addToWorkspace,
    removeFromWorkspace,
    clearWorkspace,
    reorderWorkspace,
    draggingIssueId,
  };
});
