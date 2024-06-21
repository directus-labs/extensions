<script setup lang="ts">
import { omit } from 'lodash-es';
import { computed } from 'vue';
import { useKeyboardNavigation } from '../../composables/use-keyboard-navigation';
import { useSearchHistory } from '../../composables/use-search-history';
import type { RecentSearchEntry, CollectionSearchResult } from '../../types';
import NoResults from './no-results.vue';
import RecentResultEntry from './recent-result-entry.vue';
import ResultGroup from './result-group.vue';

const props = defineProps<{
  query: string | null;
  results: CollectionSearchResult[];
  totalResults: number;
  loading: boolean;
}>();


const emit = defineEmits<{
  open: [path: string, entry: RecentSearchEntry]
}>();

const { history } = useSearchHistory()

const hasResults = computed(() => props.results.length > 0);
const navigationLength = computed(() => hasResults.value ? props.totalResults : history.value.length);
const { activeIndex } = useKeyboardNavigation(navigationLength);

const offsets = computed(() => {
  let offset = 0;
  return props.results.map((result) => {
    const start = offset;
    offset += result.hits.length;
    return start;
  });
});

function onHitSelected(result: CollectionSearchResult, index: number) {
  const hit = result.hits[index];
  emit('open', `/content/${result.collection}/${hit[result.primaryKeyField]}`, {
    ...omit(result, 'hits'),
    hit
  });
}

function onRecentSelected(entry: RecentSearchEntry) {
  emit('open', `/content/${entry.collection}/${entry.hit[entry.primaryKeyField]}`, entry);
}
</script>

<template>
  <v-list class="search-results-list">
    <template v-if="query && results.length > 0 || loading">
      <result-group v-for="(result, index) in results"
                    :query="query"
                    :result="result"
                    :active-index="activeIndex - offsets[index]"
                    @set-active-index="activeIndex = $event + offsets[index]"
                    @select="onHitSelected(result, $event)" />
    </template>
    <template v-else-if="!query">
      <div class="recents">Recents</div>
      <recent-result-entry v-for="(entry, index) in history" :key="entry.hit" :entry="entry"
                           :active="activeIndex === index"
                           @set-active="activeIndex = index"
                           @select="onRecentSelected(entry)" />
    </template>
    <no-results v-else-if="query" />
  </v-list>
</template>

<style scoped lang="scss">
.search-results-list {
  max-height: min(350px, 50vh);
  overflow-y: auto;
  transition: height var(--fast) var(--transition);

  padding: 6px;

  .recents {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025rem;
    color: var(--theme--primary);
    padding: 2px 12px;
  }
}
</style>
