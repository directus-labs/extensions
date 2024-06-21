<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGlobalSearch } from '../../composables/use-global-search';
import { useKeyboardNavigation } from '../../composables/use-keyboard-navigation';
import { useSearchHistory } from '../../composables/use-search-history';
import { RecentSearchEntry } from '../../types';
import Overlay from './overlay.vue';
import SearchInput from './search-input.vue';
import SearchResults from './search-results.vue';

const active = defineModel<boolean>('active');

const { query, results, loading, info, clear } = useGlobalSearch();
const { add: addToHistory } = useSearchHistory();

const input = ref(null);
const resultsEl = ref(null);

const router = useRouter();

function open(path: string, historyEntry?: RecentSearchEntry) {
  router.push(path);
  if (historyEntry) {
    addToHistory(historyEntry);
  }
  active.value = false;
  clear();
}
</script>

<template>
  <overlay v-model:active="active">
    <div class="command-palette">
      <search-input ref="input" v-model="query" :loading="loading" />
      <search-results ref="resultsEl" :loading="loading" :results="results" :query="query" :total-results="info.hits"
                      @open="open" />
    </div>
  </overlay>
</template>

<style scoped>
.command-palette {
  position: relative;
  margin: 10vh auto auto;
  max-width: 560px;
  background-color: var(--theme--background);
  border-radius: 8px;
  box-shadow: var(--theme--shadow);
  padding: var(--theme--spacing);
}
</style>
