<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Level } from '../types';

const props = defineProps<{
  initialTitle?: string;
  initialDescription?: string;
  initialImportance?: Level;
  initialUrgency?: Level;
  submitLabel: string;
}>();

const emit = defineEmits<{
  (e: 'submit', data: { title: string; description: string; importance: Level; urgency: Level }): void;
  (e: 'cancel'): void;
}>();

const title = ref(props.initialTitle || '');
const description = ref(props.initialDescription || '');
const importance = ref<Level>(props.initialImportance || 1);
const urgency = ref<Level>(props.initialUrgency || 1);

const isFormValid = computed(() => title.value.trim().length > 0);

const handleSubmit = () => {
  if (!isFormValid.value) return;
  emit('submit', {
    title: title.value,
    description: description.value,
    importance: importance.value,
    urgency: urgency.value,
  });
};

const levelOptions: Array<{ value: Level; label: string; activeClass: string }> = [
  { value: 4, label: 'Critical', activeClass: 'bg-red-600 text-white border-red-600' },
  { value: 3, label: 'High', activeClass: 'bg-orange-600 text-white border-orange-600' },
  { value: 2, label: 'Medium', activeClass: 'bg-amber-50 text-slate-950 border-amber-500' },
  { value: 1, label: 'Low', activeClass: 'bg-teal-600 text-white border-teal-600' },
];
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-5 py-3 transition-colors">
      <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {{ initialTitle ? 'Edit issue' : 'New issue' }}
      </h4>
      <button
        type="button"
        @click="$emit('cancel')"
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
        aria-label="Cancel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 p-5">
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
        <input
          v-model="title"
          type="text"
          required
          autofocus
          class="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-base text-slate-900 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          placeholder="A concise issue title"
        />
      </div>
      
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
        <textarea
          v-model="description"
          class="min-h-[112px] w-full resize-y rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm leading-6 text-slate-800 dark:text-slate-300 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-3 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          placeholder="Optional context, acceptance criteria, or links"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Importance</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="opt in levelOptions"
              :key="'imp-'+opt.value"
              type="button"
              @click="importance = opt.value"
              :class="[
                'rounded-md border px-2 py-2 text-xs font-semibold transition',
                importance === opt.value 
                  ? opt.activeClass 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Urgency</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="opt in levelOptions"
              :key="'urg-'+opt.value"
              type="button"
              @click="urgency = opt.value"
              :class="[
                'rounded-md border px-2 py-2 text-xs font-semibold transition',
                urgency === opt.value 
                  ? opt.activeClass 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700 pt-5 transition-colors">
        <button
          type="button"
          @click="$emit('cancel')"
          class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!isFormValid"
          class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  </div>
</template>
