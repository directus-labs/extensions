import { useStores } from '@directus/extensions-sdk';
import { uniqBy } from 'lodash-es';
import { computed } from 'vue';
import { systemCollections } from '../system-collections';
import { parsePersistedSettings } from '../utils/parse-persisted-settings';
import { readPersistedSettings } from '../utils/settings-mirror';

export function useSettings(stores?: ReturnType<typeof useStores>) {
	const resolvedStores = stores ?? useStores();
	const settings = computed(() => parsePersistedSettings(readPersistedSettings(resolvedStores)));

	const collections = computed(() =>
		uniqBy([...(settings.value?.collections ?? []), ...systemCollections], 'collection'),
	);

	const valid = computed(() => settings.value !== undefined && collections.value.length > 0);

	return { settings, collections, valid };
}
