<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';

const props = defineProps<{
  show: boolean;
  x: number;
  y: number;
}>();

const tooltipRef = ref<HTMLElement | null>(null);
let elementToClean: HTMLElement | null = null;

watch(tooltipRef, (el) => {
  if (el) {
    elementToClean = el;
  }
});

onUnmounted(() => {
  if (elementToClean && elementToClean.parentNode) {
    elementToClean.parentNode.removeChild(elementToClean);
  }
});
const position = ref({ top: 0, left: 0 });
const placement = ref<'top' | 'bottom'>('bottom');

const updatePosition = () => {
  if (!props.show || !tooltipRef.value) return;

  const tooltipRect = tooltipRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const margin = 12; // Gap from mouse
  const screenMargin = 8;
  
  let top = props.y + margin;
  let left = props.x + margin;
  placement.value = 'bottom';

  // Check if it fits at the bottom
  if (top + tooltipRect.height > viewportHeight - screenMargin) {
    // Try top
    const topPossible = props.y - tooltipRect.height - margin;
    if (topPossible > screenMargin) {
      top = topPossible;
      placement.value = 'top';
    } else {
      // If it doesn't fit anywhere, cap it to the bottom of the screen
      top = viewportHeight - tooltipRect.height - screenMargin;
    }
  }

  // Horizontal bounds
  if (left + tooltipRect.width > viewportWidth - screenMargin) {
    // Try showing it to the left of the mouse
    const leftPossible = props.x - tooltipRect.width - margin;
    if (leftPossible > screenMargin) {
      left = leftPossible;
    } else {
      left = viewportWidth - tooltipRect.width - screenMargin;
    }
  }

  position.value = { top, left };
};

watch(() => [props.show, props.x, props.y], () => {
  if (props.show) {
    nextTick(updatePosition);
  }
}, { immediate: true });
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="show"
        ref="tooltipRef"
        class="fixed z-[9999] pointer-events-none"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      >
        <div class="relative rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-800/95 max-w-xs max-h-80 overflow-hidden">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
