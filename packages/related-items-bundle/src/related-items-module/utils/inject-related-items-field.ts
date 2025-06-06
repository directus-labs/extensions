import { STORES_INJECT } from '@directus/constants';
import { system_field } from '../settings-field';
import { getDirectusApp } from './get-directus-app';
import { getDirectusRouter } from './get-directus-router';
import { unexpectedError } from './unexpected-error';
import { nextTick } from 'vue';

const config = { attributes: true, childList: true, subtree: true };
const observer = new MutationObserver((mutations) => {
	if (mutations.some((e) => (e.type === 'attributes' && e.attributeName === 'disabled' && (e.target as HTMLButtonElement).disabled))) {
		hydrateFields();
	}
});

export function injectRelatedItemsField() {
	const router = getDirectusRouter();

	if (router) {
		router.afterEach(async (to: Record<string, any>) => {
			if (observer)
				observer.disconnect();
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
		if (!('related_items_collections' in settingsStore.settings)) {
			await fieldStore.upsertField('directus_settings', 'related_items_collections', system_field);
			await settingsStore.hydrate();
		}
	}
	catch (error: any) {
		unexpectedError(error, stores);
	}

	await nextTick();
	const saveButtons = document.querySelector('.action-buttons');
	console.log(observer.observe(saveButtons as HTMLElement, config));
}

async function hydrateFields(){
	console.log('Hydrate Fields');
	const router = getDirectusRouter();

	if(router.currentRoute.value.name !== 'settings-project') return;

	const directusApp = getDirectusApp();
	const stores = directusApp._container._vnode.component.provides[STORES_INJECT];
	const { useFieldsStore } = stores;
	const fieldStore = useFieldsStore();
	setTimeout(
		await fieldStore.hydrate(), 2000);
}
