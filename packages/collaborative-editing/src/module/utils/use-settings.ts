import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';
import { ModuleSettings } from '../types';

export function useSettings(stores?: ReturnType<typeof useStores>) {
	const { useSettingsStore } = stores ?? useStores();
	const settingsStore = useSettingsStore();

	const settings = computed(() => {
		const result = ModuleSettings.safeParse(
			settingsStore.settings.collaborative_editing_settings,
		);

		if (result.success) {
			return result.data;
		}

		return null;
	});

	return { settings };
}
