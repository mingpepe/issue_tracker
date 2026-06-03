import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/notes';

export const useNoteStore = defineStore('note', () => {
  const content = ref('');
  const loading = ref(false);
  const isOffline = ref(!navigator.onLine);
  const hasPendingSync = ref(localStorage.getItem('notes_pending_sync') === 'true');

  window.addEventListener('online', () => {
    isOffline.value = false;
    if (hasPendingSync.value) {
      syncNotes();
    }
  });

  window.addEventListener('offline', () => {
    isOffline.value = true;
  });

  async function fetchNotes() {
    loading.value = true;
    try {
      const response = await axios.get<{ content: string }>(API_URL);
      content.value = response.data.content;
      localStorage.setItem('cached_notes', content.value);
      isOffline.value = false;
    } catch (error) {
      console.error('Failed to fetch notes, attempting local cache fallback:', error);
      isOffline.value = true;
      const cached = localStorage.getItem('cached_notes');
      if (cached !== null) {
        content.value = cached;
      }
    } finally {
      loading.value = false;
    }
  }

  async function syncNotes() {
    localStorage.setItem('cached_notes', content.value);
    try {
      await axios.post(API_URL, {
        content: content.value
      });
      isOffline.value = false;
      hasPendingSync.value = false;
      localStorage.setItem('notes_pending_sync', 'false');
    } catch (error) {
      console.error('Failed to sync notes, saving locally:', error);
      isOffline.value = true;
      hasPendingSync.value = true;
      localStorage.setItem('notes_pending_sync', 'true');
    }
  }

  function updateContent(newContent: string) {
    content.value = newContent;
    syncNotes();
  }

  return {
    content,
    loading,
    isOffline,
    hasPendingSync,
    fetchNotes,
    syncNotes,
    updateContent
  };
});
