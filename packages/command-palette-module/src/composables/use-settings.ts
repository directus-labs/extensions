import { useStores } from '@directus/extensions-sdk';
import { uniqBy } from 'lodash-es';
import { computed } from 'vue';
import { systemCollections } from '../system-collections';
import { parsePersistedSettings } from '../utils/parse-persisted-settings';

export function useSettings(stores?: ReturnType<typeof useStores>) {
	const { useSettingsStore } = stores ?? useStores();
	const settingsStore = useSettingsStore();

	const settings = computed(() =>
		parsePersistedSettings(settingsStore.settings.command_palette_settings),
	);

	const collections = computed(() =>
		uniqBy([...(settings.value?.collections ?? []), ...systemCollections], 'collection'),
	);

	const valid = computed(() => settings.value !== undefined && collections.value.length > 0);

	return { settings, collections, valid };
}
