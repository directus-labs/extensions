<script setup lang="ts">
import { OPEN_SEARCH_EVENT } from '../constants';

function onClick() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
}
</script>

<template>
  <div class="search-bar" @click="onClick">
    <span>Search...</span>
    <span class="keys">
    <kbd>⌘</kbd>
    <kbd>K</kbd>
  </span>
  </div>
</template>

<style scoped>
.search-bar {
  cursor: pointer;
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--theme--border-color);
  padding: 6px 12px;
  border-radius: var(--theme--border-radius);
  margin-left: 24px;

  transition: all var(--fast) var(--transition);
}

.search-bar:hover {
  border-color: var(--theme--primary);
  color: var(--theme--foreground-accent);
}

.keys {
  border: 1px solid var(--theme--border-color);
  padding: 0 6px;
  border-radius: 4px;
  font-size: 87.5%;
}
</style>
