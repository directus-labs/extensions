import { useStores } from '@directus/extensions-sdk';

export function getCurrentLanguage() {
	const { useUserStore, useSettingsStore } = useStores();

	const usersStore = useUserStore();
	const settingsStore = useSettingsStore();

	if (usersStore.currentUser?.language) {
		return usersStore.currentUser.language;
	}

	if (settingsStore.setting?.default_language) {
		return settingsStore.setting.default_language;
	}

	return 'en-US';
}
