import { defineModule } from '@directus/extensions-sdk';
import ModuleSettings from './settings.vue';
import { injectRealtimeApp } from './utils/inject-realtime-app';
export default defineModule({
	id: 'realtime-settings',
	name: 'Realtime Collaboration',
	icon: 'communication',
	routes: [
		{
			path: '',
			component: ModuleSettings,
		},
	],
	preRegisterCheck() {
		injectRealtimeApp();
		return true;
	},
});
