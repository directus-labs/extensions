import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './settings.vue';
import { initializeCollaborativeEditing } from './utils/initialize-collaborative-editing';
export default defineModule({
	id: 'collab-module',
	name: 'Collaborative Editing',
	icon: 'communication',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
	preRegisterCheck() {
		initializeCollaborativeEditing();
		return true;
	},
});
