import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';
import Settings from './settings.vue';

declare global {
	interface Window {
		globalSearchListenerAdded: boolean;
	}
}

function handleCmdK(event: KeyboardEvent, router: { name: string; }[]) {
	if (event.metaKey && event.key === 'k') {
		router.push({ name: 'global-search-index' });
	}
}

function addCmdKListener() {
	if (!window.globalSearchListenerAdded) {
        // @ts-ignore @TODO: not sure the best way to type this
		const app = document.getElementById('app')?.__vue_app__
		const router = app.config?.globalProperties?.$router;

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
		addCmdKListener();
		return true;
	},
});
