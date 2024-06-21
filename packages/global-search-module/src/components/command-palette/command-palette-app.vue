<script setup lang="ts">
import { onKeyDown, useEventListener } from '@vueuse/core';
import { ref } from 'vue';
import { OPEN_SEARCH_EVENT } from '../../constants';
import CommandPalette from './command-palette.vue';

const active = ref(false);
onKeyDown('k', (e) => {
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }
});
onKeyDown('Escape', () => {
  active.value = false;
});

useEventListener(OPEN_SEARCH_EVENT, () => {
  active.value = true;
});

function toggle() {
  active.value = !active.value;
}
</script>

<template>
  <command-palette v-model:active="active" />
</template>
