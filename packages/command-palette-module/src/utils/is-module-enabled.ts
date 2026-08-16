import type { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';

export function isModuleEnabled(
	stores: ReturnType<typeof useStores>,
	moduleId = 'global-search',
) {
	const { useSettingsStore } = stores;
	const settingsStore = useSettingsStore();
	return (settingsStore.settings as Settings | undefined)?.module_bar?.find(
		(module) => module.type === 'module' && module.id === moduleId,
	)?.enabled === true;
}
