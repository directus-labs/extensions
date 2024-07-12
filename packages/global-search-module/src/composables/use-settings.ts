import { useStores } from "@directus/extensions-sdk";
import { uniqBy } from "lodash-es";
import { computed } from "vue";
import { systemCollections } from "../system-collections";
import { SearchConfig } from "../types";

export function useSettings(stores?: ReturnType<typeof useStores>) {
  const { useSettingsStore } = stores ?? useStores();
  const settingsStore = useSettingsStore();

  const settings = computed(() => {
    const result = SearchConfig.safeParse(
      settingsStore.settings.global_search_settings,
    );

    if (result.success) {
      return result.data;
    }

    return null;
  });

  const collections = computed(() => {
    return uniqBy(
      [...(settings.value?.collections ?? []), ...systemCollections],
      "collection",
    );
  });

  const valid = computed(() => {
    // Check if the global search settings exist and the collections to search are valid
    return !!settings.value && collections.value.length > 0;
  });

  return { settings, collections, valid };
}
