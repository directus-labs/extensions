import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './module.vue';

export default defineModule({
	id: 'migration',
	name: 'Migration',
	icon: 'cloud_upload',
	routes: [
		{
			path: '',
			component: ModuleComponent,
		},
	],
});
