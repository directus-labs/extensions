<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useSettings } from "../composables/use-settings";
import { OPEN_SEARCH_EVENT } from "../constants";
import { isMacOS } from "../utils/is-mac-os";

const settings = useSettings();
const router = useRouter();

const commandPaletteEnabled = computed(
  () => settings.settings.value?.commandPaletteEnabled !== false,
);

function onClick() {
  if (commandPaletteEnabled.value) {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));
  } else {
    router.push({ name: "global-search-index" });
  }
}
</script>

<template>
  <div class="search-bar" @click="onClick">
    <span>Search...</span>
    <span v-if="commandPaletteEnabled" class="keys">
      <kbd>{{ isMacOS() ? "⌘" : "Ctrl+" }}</kbd>
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
  color: var(--theme--foreground-subdued);

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
