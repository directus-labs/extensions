import type { App } from 'vue';
import { STORES_INJECT } from '@directus/constants';
import { createApp, inject, nextTick } from 'vue';
import { routerKey } from 'vue-router';
import SearchBar from '../components/search-bar.vue';
import { getDirectusApp, getDirectusAppProvides } from './get-directus-app';
import { getDirectusRouter } from './get-directus-router';
import { isModuleEnabled } from './is-module-enabled';

const ID = 'global-search-bar';

let app: App | null = null;

export function injectSearchBar() {
	const router = getDirectusRouter();

	router.afterEach(async (to) => {
		if (to.name !== 'global-search-index') {
			if (!checkEnabled())
				return;

			// Wait for DOM to be built and then inject search bar
			await nextTick();
			injectApp();
		}
	});
}

function injectApp(retry: number = 0) {
	if (document.getElementById(ID))
		return;

	const titleContainer = document.querySelector('.title-container');

	if (!titleContainer) {
		// This is needed for the initial page load, as things might be slow to set up
		if (retry < 3) {
			setTimeout(() => injectApp(retry + 1), 100);
		}

		return;
	}

	const searchBar = document.createElement('div');
	searchBar.id = ID;

	titleContainer!.appendChild(searchBar);

	if (app) {
		app.unmount();
	}

	const directusApp = getDirectusApp();
	const injects = getDirectusAppProvides(directusApp);

	app = createApp(SearchBar);
	app.provide(STORES_INJECT, injects[STORES_INJECT]);

	directusApp.runWithContext(() => {
		app!.provide(routerKey, inject(routerKey)!);
	});

	app.mount(searchBar);
}

function checkEnabled() {
	const stores
    = getDirectusApp()._container._vnode.component.provides[STORES_INJECT];

	return isModuleEnabled(stores);
}
