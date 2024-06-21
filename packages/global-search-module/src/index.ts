import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';
import Settings from './settings.vue';
import { getDirectusRouter } from './utils/get-directus-router';
import { injectCommandPalette } from './utils/inject-command-palette';
import { injectSearchBar } from './utils/inject-search-bar';

declare global {
	interface Window {
		globalSearchListenerAdded: boolean;
	}
}

function handleCmdK(event: KeyboardEvent, router: { name: string; }[]) {
	if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
		router.push({ name: 'global-search-index' });
	}
}

function addCmdKListener() {
	if (!window.globalSearchListenerAdded) {
		const router = getDirectusRouter();

		if (router) {
			window.addEventListener('keydown', (event) => handleCmdK(event, router));
			window.globalSearchListenerAdded = true;
		}
	}
}

export default defineModule({
	id: 'global-search',
	name: 'Global Search',
	icon: 'search',
	routes: [
		{
			path: '',
			name: 'global-search-index',
			component: ModuleComponent,
		},
		{
			path: 'settings',
			name: 'global-search-settings',
			component: Settings,
		},
	],
	preRegisterCheck() {
		// TODO only inject if module is actually enabled in project settings
		// addCmdKListener();
		injectSearchBar();
		injectCommandPalette();
		return true;
	},
});
