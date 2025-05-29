import { STORES_INJECT } from '@directus/constants';
import { system_field } from '../settings-field';
import { getDirectusApp } from './get-directus-app';
import { getDirectusRouter } from './get-directus-router';
import { unexpectedError } from './unexpected-error';

export function injectRelatedItemsField() {
	const router = getDirectusRouter();

	if (router) {
		router.afterEach(async (to: Record<string, any>) => {
			if (to.name === 'settings-project') {
				initializeApp();
			}
		});
	}
}

async function initializeApp(retry: number = 0) {
	const titleContainer = document.querySelector('.title-container');

	if (!titleContainer) {
		if (retry < 3) {
			setTimeout(() => initializeApp(retry + 1), 100);
		}

		return;
	}

	const directusApp = getDirectusApp();
	const stores = directusApp._container._vnode.component.provides[STORES_INJECT];

	const { useFieldsStore, useSettingsStore } = stores;
	const fieldStore = useFieldsStore();
	const settingsStore = useSettingsStore();

	try {
		// Exit if no settings found
		if (!('related_items_collections' in settingsStore.settings)) {
			// Create required fields
			await fieldStore.upsertField('directus_settings', 'related_items_collections', system_field);
			await settingsStore.hydrate();
		}
	}
	catch (error: any) {
		unexpectedError(error, stores);
	}
}
