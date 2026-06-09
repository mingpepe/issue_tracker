<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import type { Issue, Level } from '../types';
import { useIssueStore } from '../store/issueStore';
import IssueForm from './IssueForm.vue';
import Tooltip from './Tooltip.vue';
import draggable from 'vuedraggable';

const props = defineProps<{
  issue: Issue;
  depth: number;
  inheritedTheme?: { card: string; accent: string };
}>();

const store = useIssueStore();
const isExpanded = ref(true);

const isDescendant = (parentId: string, childId: string): boolean => {
  const parent = store.findIssueByIdInAllTabs(parentId);
  if (!parent) return false;
  
  const check = (list: any[]): boolean => {
    for (const item of list) {
      if (item.id === childId) return true;
      if (item.children && check(item.children)) return true;
    }
    return false;
  };
  
  return check(parent.children);
};

const isDescendantOfDragged = computed(() => {
  if (!store.draggingIssueId) return false;
  return isDescendant(store.draggingIssueId, props.issue.id);
});

const dragCounter = ref(0);
const isDragOver = computed(() => dragCounter.value > 0);

const handleDragEnter = () => {
  if (store.draggingIssueId && store.draggingIssueId !== props.issue.id && !isDescendantOfDragged.value) {
    dragCounter.value++;
  }
};

const handleDragLeave = () => {
  if (store.draggingIssueId && store.draggingIssueId !== props.issue.id && !isDescendantOfDragged.value) {
    dragCounter.value--;
  }
};

watch(() => store.draggingIssueId, (newId) => {
  if (!newId) {
    dragCounter.value = 0;
  }
});

const isAddingChild = ref(false);
const isEditing = ref(false);

const editFormRef = ref<any>(null);
const addFormRef = ref<any>(null);
const showTooltip = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const handleMouseEnter = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
  showTooltip.value = true;
};

const handleClickOutside = (event: MouseEvent) => {
  if (isEditing.value && editFormRef.value) {
    const el = editFormRef.value.$el || editFormRef.value;
    if (!el.contains(event.target as Node)) {
      editFormRef.value.saveOnOutsideClick();
    }
  }
  if (isAddingChild.value && addFormRef.value) {
    const el = addFormRef.value.$el || addFormRef.value;
    if (!el.contains(event.target as Node)) {
      addFormRef.value.handleCancel();
    }
  }
};

watch([isEditing, isAddingChild, () => store.draggingIssueId], ([newEdit, newAdd]) => {
  showTooltip.value = false;
  if (newEdit || newAdd) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside, true);
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
  showTooltip.value = false;
});

const isSelected = computed(() => store.selectedIds.has(props.issue.id));
const isLastSelected = computed(() => store.lastSelectedId === props.issue.id);
const isInWorkspace = computed(() => store.workspaceIds.includes(props.issue.id) && !props.issue.completed);

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

const visibleChildrenCount = computed(() => {
  if (store.showDone) {
    return props.issue.children.length;
  }
  return props.issue.children.filter(i => !i.completed).length;
});

const themeClass = computed(() => {
  if (props.issue.completed) return null;
  if (props.inheritedTheme) return props.inheritedTheme;
  if (props.depth !== 0) return null;
  
  const colors = [
    { card: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/50', accent: 'bg-indigo-500' },
    { card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-500/50', accent: 'bg-emerald-500' },
    { card: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-500/50', accent: 'bg-rose-500' },
    { card: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/50', accent: 'bg-amber-500' },
    { card: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-500/50', accent: 'bg-sky-500' },
    { card: 'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:border-fuchsia-500/50', accent: 'bg-fuchsia-500' },
    { card: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-500/50', accent: 'bg-orange-500' },
    { card: 'bg-lime-50 border-lime-200 dark:bg-lime-900/20 dark:border-lime-500/50', accent: 'bg-lime-500' },
    { card: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-500/50', accent: 'bg-cyan-500' },
    { card: 'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-500/50', accent: 'bg-pink-500' },
    { card: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-500/50', accent: 'bg-violet-500' },
    { card: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-500/50', accent: 'bg-teal-500' },
    { card: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/50', accent: 'bg-blue-500' },
    { card: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/50', accent: 'bg-red-500' },
    { card: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-500/50', accent: 'bg-yellow-500' },
    { card: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/50', accent: 'bg-green-500' },
    { card: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-500/50', accent: 'bg-purple-500' },
    { card: 'bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-500/50', accent: 'bg-slate-500' },
  ];
  
  let hash = 0;
  for (let i = 0; i < props.issue.id.length; i++) {
    hash = (hash << 5) - hash + props.issue.id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Mix in the order to further diversify if hashes collide
  const finalIndex = Math.abs(hash + props.issue.order) % colors.length;
  return colors[finalIndex];
});
</script>

<template>
  <div 
    class="relative group/item" 
    :class="{ 'opacity-60': issue.completed }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <div v-if="depth > 0" class="absolute -left-5 bottom-0 top-0 w-px bg-slate-200 dark:bg-slate-700 group-last/item:bottom-1/2"></div>
    <div v-if="depth > 0" class="absolute -left-5 top-6 h-px w-4 bg-slate-200 dark:bg-slate-700"></div>

    <div 
      class="group/card relative rounded-lg border bg-white dark:bg-slate-800 shadow-sm transition"
      :class="[
        themeClass ? themeClass.card : 'border-slate-200 dark:border-slate-700',
        isEditing ? 'border-blue-300 ring-4 ring-blue-100 dark:border-blue-500/50 dark:ring-blue-900/30' : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:z-40',
        isSelected ? 'ring-2 ring-indigo-500 dark:ring-indigo-600 z-10' : '',
        isLastSelected && !isEditing ? 'border-dashed border-amber-400 dark:border-amber-500/50 ring-2 ring-amber-500/20' : '',
        depth > 0 ? 'py-0' : ''
      ]"
    >
      <!-- Theme Accent Bar -->
      <div v-if="themeClass" class="absolute top-0 left-0 bottom-0 w-2" :class="themeClass.accent"></div>
      
      <!-- Urgency Accent -->
      <div class="absolute bottom-0 left-0 top-0 w-1 overflow-hidden rounded-l-lg" :class="[urgencyConfig.accent, themeClass ? 'ml-2' : '']"></div>

      <div v-if="!isEditing" class="flex flex-col gap-2 p-1.5 pl-4 sm:flex-row sm:items-center" :class="{ 'sm:gap-1': depth > 0 }">
        <div class="flex items-center gap-2">
          <!-- Drag Handle Grip -->
          <div 
            v-if="!issue.completed"
            class="drag-handle flex h-6 w-5 flex-shrink-0 items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing transition"
            title="Drag to reorder"
            @click.stop
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13 16a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
          <div v-else class="w-5 h-6 flex-shrink-0"></div>

          <!-- Selection Checkbox -->
          <div class="flex items-center" @click.stop>
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

          <!-- Expand button -->
          <button 
            v-if="issue.children.length > 0"
            @click.stop="isExpanded = !isExpanded"
            class="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
            aria-label="Toggle child issues"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform" :class="isExpanded ? 'rotate-0' : '-rotate-90'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div v-else class="hidden h-6 w-6 flex-shrink-0 items-center justify-center sm:flex">
            <span class="h-1.5 w-1.5 rounded-full" :class="urgencyConfig.accent"></span>
          </div>
        </div>

        <div class="flex-1 min-w-0 flex items-center gap-3">
          <button 
            @click.stop="toggleDone"
            class="group/check relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all"
            :class="issue.completed ? 'bg-green-600 border-green-600' : 'border-slate-300 dark:border-slate-600 hover:border-green-500'"
          >
            <svg v-if="issue.completed" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <div 
            class="flex-1 min-w-0 flex flex-col justify-center cursor-pointer group/text relative" 
            @click.stop="!issue.completed && (isEditing = true)"
            @mouseenter="handleMouseEnter"
            @mousemove="handleMouseMove"
            @mouseleave="showTooltip = false"
          >
            <!-- Description Hover Tooltip -->
            <Tooltip 
              v-if="issue.description"
              :show="showTooltip"
              :x="mouseX"
              :y="mouseY"
            >
              <div class="mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1 dark:border-slate-700">
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Description</span>
              </div>
              <p class="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {{ issue.description }}
              </p>
            </Tooltip>

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
                <span v-if="isLastSelected && !isEditing" class="rounded px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white ring-1 ring-amber-400 uppercase tracking-tighter flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Parent Mode
                </span>
                <span v-if="isInWorkspace" class="rounded px-1.5 py-0.5 text-[10px] font-black bg-indigo-600 text-white ring-1 ring-indigo-500 uppercase tracking-tighter flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Working
                </span>
                <span class="rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase" :class="importanceConfig.className">
                  {{ importanceConfig.label }}
                </span>
                <span v-if="visibleChildrenCount > 0" class="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-colors uppercase">
                  {{ visibleChildrenCount }} Sub
                </span>
              </div>
            </div>
            <p v-if="issue.description" class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
              {{ issue.description }}
            </p>
          </div>
        </div>

        <div class="flex flex-shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition sm:group-hover/card:opacity-100" @click.stop>
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

      <div v-else class="bg-slate-50 dark:bg-slate-900/50 p-3 transition-colors" @click.stop>
        <IssueForm
          ref="editFormRef"
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

    <div v-if="isAddingChild" class="ml-6 mt-1 sm:ml-10" @click.stop>
      <IssueForm
        ref="addFormRef"
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
        class="space-y-1 transition-all duration-200"
        :class="[
          store.draggingIssueId && 
          store.draggingIssueId !== issue.id && 
          !isDescendantOfDragged &&
          childIssues.length === 0 &&
          isDragOver
            ? 'min-h-[44px] border border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl bg-indigo-50/10 dark:bg-indigo-900/5 flex items-center justify-center'
            : 'min-h-[4px]'
        ]"
        :group="{ name: 'issues' }"
        @start="store.draggingIssueId = ($event.item as any)._underlying_vm_.id"
        @end="store.draggingIssueId = null"
        @pointerdown.stop
        @mousedown.stop
        @touchstart.stop
      >
        <template #header>
          <div 
            v-if="store.draggingIssueId && store.draggingIssueId !== issue.id && !isDescendantOfDragged && childIssues.length === 0 && isDragOver" 
            class="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest select-none pointer-events-none py-2"
          >
            ➕ Drop here to make sub-task
          </div>
        </template>
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
