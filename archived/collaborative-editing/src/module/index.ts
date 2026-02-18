import { defineModule } from '@directus/extensions-sdk';
import { MODULE_ID } from '../shared/constants';
import ModuleSettings from './settings.vue';
import { injectRealtimeApp } from './utils/inject-realtime-app';
export default defineModule({
	id: MODULE_ID,
	name: 'Collaborative Editing',
	icon: 'communication',
	routes: [
		{
			path: '',
			component: ModuleSettings,
		},
	],
	preRegisterCheck(user) {
		if (!user.admin_access) return false;

		injectRealtimeApp();
		return true;
	},
});
