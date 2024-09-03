<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { computed, onUnmounted, ref } from "vue";
import { injectCommandRootContext } from "./command.vue";

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "Suggestions",
  },
);

const context = injectCommandRootContext();
const currentRef = ref<HTMLElement | null>(null);

const innerRef = computed<HTMLDivElement | null>({
  get: () => context.listInnerRef.value,
  set: (value) => (context.listInnerRef.value = value),
});

let animationFrame: number;

useResizeObserver(context.listInnerRef, () => {
  animationFrame = requestAnimationFrame(() => {
    const el = context.listInnerRef.value;
    if (!el) return;

    const height = el.offsetHeight;

    currentRef.value?.style.setProperty(
      `--cmdk-list-height`,
      height.toFixed(1) + "px",
    );
  });
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <div
    :id="context.listId"
    ref="currentRef"
    cmdk-list
    role="listbox"
    :aria-label="label"
  >
    <div ref="innerRef" cmdk-list-sizer>
      <slot />
    </div>
  </div>
</template>
