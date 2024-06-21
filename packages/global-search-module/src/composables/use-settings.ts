import { computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';
import { SearchConfig } from '../types';

export function useSettings() {
  const { useSettingsStore } = useStores();
  const settingsStore = useSettingsStore();

  const settings = computed(() => {
    const result = SearchConfig.safeParse(settingsStore.settings.global_search_settings);
    if (result.success) {
      return result.data;
    }
    return null;
  });

  const collections = computed(() => {
    return settings.value?.collections ?? [];
  });

  const valid = computed(() => {
    // Check if the global search settings exist and the collections to search are valid
    return !!settings.value && collections.value.length > 0;
  });

  return { settings, collections, valid };
}
