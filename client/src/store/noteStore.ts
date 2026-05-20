import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/notes';

export const useNoteStore = defineStore('note', () => {
  const content = ref('');
  const loading = ref(false);

  async function fetchNotes() {
    loading.value = true;
    try {
      const response = await axios.get<{ content: string }>(API_URL);
      content.value = response.data.content;
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      loading.value = false;
    }
  }

  async function syncNotes() {
    try {
      await axios.post(API_URL, {
        content: content.value
      });
    } catch (error) {
      console.error('Failed to sync notes:', error);
    }
  }

  function updateContent(newContent: string) {
    content.value = newContent;
    syncNotes();
  }

  return {
    content,
    loading,
    fetchNotes,
    syncNotes,
    updateContent
  };
});
