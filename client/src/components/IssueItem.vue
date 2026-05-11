<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Issue, Level } from '../types';
import { useIssueStore } from '../store/issueStore';
import IssueForm from './IssueForm.vue';
import draggable from 'vuedraggable';

const props = defineProps<{
  issue: Issue;
  depth: number;
  inheritedTheme?: { card: string; accent: string };
}>();

const store = useIssueStore();
const isExpanded = ref(true);
const isAddingChild = ref(false);
const isEditing = ref(false);

const isSelected = computed(() => store.selectedIds.has(props.issue.id));

const childIssues = computed({
  get: () => props.issue.children.filter(i => !i.completed).sort((a, b) => a.order - b.order),
  set: (val) => {
    val.forEach((item, index) => {
      item.order = index;
    });
    // Merge back with done children
    const doneChildren = props.issue.children.filter(i => i.completed);
    props.issue.children = [...val, ...doneChildren];
    store.syncIssues();
  }
});

const doneChildren = computed(() => props.issue.children.filter(i => i.completed).sort((a, b) => b.createdAt - a.createdAt));

const importanceConfig = computed(() => {
  if (props.issue.completed) return { label: 'Completed', className: 'bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:ring-slate-700' };
  switch (props.issue.importance) {
    case 4: return { label: 'Critical', className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/30' };
    case 3: return { label: 'High', className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-900/30' };
    case 2: return { label: 'Medium', className: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/30' };
    case 1: return { label: 'Low', className: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-900/30' };
    default: return { label: 'Unknown', className: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700' };
  }
});

const urgencyConfig = computed(() => {
  if (props.issue.completed) return { label: 'Done', accent: 'bg-slate-300 dark:bg-slate-700', className: 'bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:ring-slate-700' };
  switch (props.issue.urgency) {
    case 4: return { label: 'Urgent', accent: 'bg-red-600', className: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/30' };
    case 3: return { label: 'Soon', accent: 'bg-orange-500', className: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-900/30' };
    case 2: return { label: 'Normal', accent: 'bg-amber-500', className: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/30' };
    case 1: return { label: 'Later', accent: 'bg-teal-600', className: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:ring-teal-900/30' };
    default: return { label: 'Unknown', accent: 'bg-slate-400', className: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700' };
  }
});

const handleAddChild = (data: { title: string; description: string; importance: Level; urgency: Level }) => {
  store.addIssue(props.issue.id, data.title, data.importance, data.urgency, data.description);
  isAddingChild.value = false;
  isExpanded.value = true;
};

const handleUpdate = (data: { title: string; description: string; importance: Level; urgency: Level }) => {
  store.updateIssue(props.issue.id, data);
  isEditing.value = false;
};

const handleDelete = () => {
  store.deleteIssue(props.issue.id);
};

const toggleDone = () => {
  store.toggleIssueComplete(props.issue.id);
};

const toggleSelection = () => {
  store.toggleSelection(props.issue.id);
};

const themeClass = computed(() => {
  if (props.issue.completed) return null;
  if (props.inheritedTheme) return props.inheritedTheme;
  if (props.depth !== 0) return null;
  
  const colors = [
    { card: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/40 dark:border-indigo-700', accent: 'bg-indigo-600' },
    { card: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-700', accent: 'bg-emerald-600' },
    { card: 'bg-rose-100 border-rose-300 dark:bg-rose-900/40 dark:border-rose-700', accent: 'bg-rose-600' },
    { card: 'bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700', accent: 'bg-amber-600' },
    { card: 'bg-sky-100 border-sky-300 dark:bg-sky-900/40 dark:border-sky-700', accent: 'bg-sky-600' },
    { card: 'bg-violet-100 border-violet-300 dark:bg-violet-900/40 dark:border-violet-700', accent: 'bg-violet-600' },
    { card: 'bg-orange-100 border-orange-300 dark:bg-orange-900/40 dark:border-orange-700', accent: 'bg-orange-600' },
    { card: 'bg-lime-100 border-lime-300 dark:bg-lime-900/40 dark:border-lime-700', accent: 'bg-lime-600' },
  ];
  
  let hash = 0;
  for (let i = 0; i < props.issue.id.length; i++) {
    hash = props.issue.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
});
</script>

<template>
  <div class="relative group/item" :class="{ 'opacity-60': issue.completed }">
    <div v-if="depth > 0" class="absolute -left-5 bottom-0 top-0 w-px bg-slate-200 dark:bg-slate-700 group-last/item:bottom-1/2"></div>
    <div v-if="depth > 0" class="absolute -left-5 top-6 h-px w-4 bg-slate-200 dark:bg-slate-700"></div>

    <div 
      class="group/card relative rounded-lg border bg-white dark:bg-slate-800 shadow-sm transition"
      :class="[
        themeClass ? themeClass.card : 'border-slate-200 dark:border-slate-700',
        isEditing ? 'border-blue-300 ring-4 ring-blue-100 dark:border-blue-500/50 dark:ring-blue-900/30' : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:z-40',
        isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-600 z-10' : '',
        depth > 0 ? 'py-0' : ''
      ]"
    >
      <!-- Theme Accent Bar -->
      <div v-if="themeClass" class="absolute top-0 left-0 bottom-0 w-1.5" :class="themeClass.accent"></div>
      
      <!-- Urgency Accent -->
      <div class="absolute bottom-0 left-0 top-0 w-1 overflow-hidden rounded-l-lg" :class="[urgencyConfig.accent, themeClass ? 'ml-1.5' : '']"></div>

      <div v-if="!isEditing" class="flex flex-col gap-2 p-1.5 pl-4 sm:flex-row sm:items-center" :class="{ 'sm:gap-1': depth > 0 }">
        <!-- Selection Checkbox -->
        <div class="flex items-center">
          <button 
            @click="toggleSelection"
            class="flex h-4 w-4 items-center justify-center rounded border transition-all"
            :class="isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'"
          >
            <svg v-if="isSelected" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Drag Handle -->
        <div v-if="!issue.completed" class="drag-handle cursor-grab text-slate-300 hover:text-slate-500 dark:text-slate-700 dark:hover:text-slate-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </div>

        <button 
          v-if="issue.children.length > 0"
          @click="isExpanded = !isExpanded"
          class="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
          aria-label="Toggle child issues"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 transition-transform" :class="isExpanded ? 'rotate-0' : '-rotate-90'" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <div v-else class="hidden h-6 w-6 flex-shrink-0 items-center justify-center sm:flex">
          <span class="h-1.5 w-1.5 rounded-full" :class="urgencyConfig.accent"></span>
        </div>

        <div class="flex-1 min-w-0 flex items-center gap-3">
          <button 
            @click="toggleDone"
            class="group/check relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all"
            :class="issue.completed ? 'bg-green-600 border-green-600' : 'border-slate-300 dark:border-slate-600 hover:border-green-500'"
          >
            <svg v-if="issue.completed" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div 
            class="flex-1 min-w-0 flex flex-col justify-center cursor-pointer group/text" 
            @click="!issue.completed && (isEditing = true)"
            title="Click to edit"
          >
            <div class="flex items-center gap-3">
              <h3 
                class="truncate text-sm font-semibold transition-all"
                :class="[
                  issue.completed ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-950 dark:text-slate-100 group-hover/text:text-indigo-600 dark:group-hover/text:text-indigo-400'
                ]"
              >
                {{ issue.title }}
              </h3>
              
              <div class="flex flex-wrap items-center gap-1">
                <span class="rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase" :class="importanceConfig.className">
                  {{ importanceConfig.label }}
                </span>
                <span v-if="issue.children.length > 0" class="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-colors uppercase">
                  {{ issue.children.length }} Sub
                </span>
              </div>
            </div>
            <p v-if="issue.description" class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
              {{ issue.description }}
            </p>
          </div>
        </div>

        <div class="flex flex-shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition sm:group-hover/card:opacity-100">
          <button v-if="!issue.completed" @click="isAddingChild = !isAddingChild" class="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add
          </button>
          <button v-if="!issue.completed" @click="isEditing = true" class="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          
          <!-- Move to Tab Dropdown -->
          <div v-if="!issue.completed && store.tabs.length > 1" class="relative group/move">
            <button @click.stop class="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Move
            </button>
            <div class="absolute right-0 top-full z-[100] mt-0 hidden w-40 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-10 focus:outline-none group-hover/move:block border border-slate-200 dark:border-slate-700">
              <div class="py-1">
                <div class="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 mb-1">Move to Tab</div>
                <button
                  v-for="tab in store.tabs.filter(t => t.id !== store.activeTabId)"
                  :key="tab.id"
                  @click.stop="store.moveIssueToTab(issue.id, tab.id)"
                  class="block w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                >
                  {{ tab.name }}
                </button>
              </div>
            </div>
          </div>

          <button @click="handleDelete" class="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Del
          </button>
        </div>
      </div>

      <div v-else class="bg-slate-50 dark:bg-slate-900/50 p-3 transition-colors">
        <IssueForm
          :initial-title="issue.title"
          :initial-description="issue.description"
          :initial-importance="issue.importance"
          :initial-urgency="issue.urgency"
          submit-label="Save Changes"
          @submit="handleUpdate"
          @cancel="isEditing = false"
        />
      </div>
    </div>

    <div v-if="isAddingChild" class="ml-6 mt-1 sm:ml-10">
      <IssueForm
        submit-label="Create Sub-task"
        @submit="handleAddChild"
        @cancel="isAddingChild = false"
      />
    </div>

    <div v-if="isExpanded && (issue.children.length > 0 || !issue.completed)" class="ml-6 mt-1 space-y-1 sm:ml-10">
      <draggable 
        v-model="childIssues" 
        item-key="id"
        handle=".drag-handle"
        ghost-class="ghost-class"
        class="space-y-1 min-h-[4px]"
        :group="{ name: 'issues' }"
        @start="store.draggingIssueId = ($event.item as any)._underlying_vm_.id"
        @end="store.draggingIssueId = null"
      >
        <template #item="{ element }">
          <IssueItem 
            :issue="element" 
            :depth="depth + 1" 
            :inherited-theme="themeClass || undefined"
          />
        </template>
      </draggable>

      <div v-if="store.showDone && doneChildren.length > 0" class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <IssueItem 
          v-for="child in doneChildren" 
          :key="child.id" 
          :issue="child" 
          :depth="depth + 1" 
          :inherited-theme="themeClass || undefined"
        />
      </div>
    </div>
  </div>
</template>
