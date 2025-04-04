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

function injectApp(retry = 0) {
	if (document.querySelector(`#${ID}`))
		return;

	const moduleNavContent = document.querySelector('.module-nav-content');
	const contentNavigationWrapper = document.querySelector('.content-navigation-wrapper');

	const searchInputContainer = moduleNavContent?.querySelector('.search-input');

	let searchBar: HTMLElement | null = null;

	if (searchInputContainer) {
		searchBar = document.createElement('div');
		searchBar.id = ID;

		// Replace the existing search input with our custom one
		searchInputContainer.parentNode?.replaceChild(searchBar, searchInputContainer);
	}
	else {
		// If search input container not found but navigation wrapper exists, inject into it
		if (contentNavigationWrapper) {
			searchBar = document.createElement('div');
			searchBar.id = ID;
			contentNavigationWrapper.prepend(searchBar);
		}

		// Fallback to module nav content if no navigation wrapper is found
		else if (moduleNavContent) {
			searchBar = document.createElement('div');
			searchBar.id = ID;
			moduleNavContent.prepend(searchBar);
		}
		else {
			// Fall back to the header spacer if no navigation wrapper is found
			const container = document.querySelector('header > .spacer');

			if (!container) {
				// This is needed for the initial page load, as things might be slow to set up
				if (retry < 3) {
					setTimeout(() => injectApp(retry + 1), 100);
				}

				return;
			}

			searchBar = document.createElement('div');
			searchBar.id = ID;
			container.append(searchBar);
		}
	}

	if (app) {
		app.unmount();
	}

	const directusApp = getDirectusApp();
	const injects = getDirectusAppProvides(directusApp);

	app = createApp(SearchBar);
	app.provide(STORES_INJECT, injects[STORES_INJECT]);

	directusApp.runWithContext(() => {
		const router = inject(routerKey);

		if (app && router) {
			app.provide(routerKey, router);
		}
	});

	app.mount(searchBar);
}

function checkEnabled() {
	const stores =
    getDirectusApp()._container._vnode.component.provides[STORES_INJECT];

	return isModuleEnabled(stores);
}
