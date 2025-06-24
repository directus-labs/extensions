import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';
import { ModuleSettings } from '../types';

export function useSettings(stores?: ReturnType<typeof useStores>) {
	const { useSettingsStore } = stores ?? useStores();
	const settingsStore = useSettingsStore();

	const settings = computed(() => {
		const result = ModuleSettings.safeParse(settingsStore.settings.collaborative_editing_settings);

		if (result.success) {
			return result.data;
		}

		return null;
	});

	const enabledGlobally = computed(() => {
		return settings.value?.enabled_globally;
	});

	// @TODO: implement this after next milestone
	// Uncomment the dropdown field for collections in the module definition
	/*const collections = computed(() => {
		return uniqBy([...(settings.value?.collections ?? [])], 'collection');
	});*/

	return { settings, enabledGlobally };
}
