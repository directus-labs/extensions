import { useStorage } from '@vueuse/core';
import { computed } from 'vue';
import type { RecentSearchEntry } from '../types';
import { useSettings } from './use-settings';

export function useSearchHistory() {
  const history = useStorage<RecentSearchEntry[]>('global-search-recents', []);
  const { settings } = useSettings();

  return { history: computed(() => [...history.value].reverse()), add };

  function add(entry: RecentSearchEntry) {
    const existingIndex = history.value.findIndex(({
                                                hit,
                                                primaryKeyField,
                                                collection
                                              }) => collection === entry.collection && hit[primaryKeyField] === entry.hit[entry.primaryKeyField]);
    if (existingIndex >= 0) {
      history.value.splice(existingIndex, 1);
    }
    history.value.push(entry);

    while (history.value.length > (settings.value?.recentSearchLimit ?? 5)) {
      history.value.shift();
    }
  }
}
