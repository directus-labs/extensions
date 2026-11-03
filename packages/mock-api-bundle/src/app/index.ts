import { defineModule } from '@directus/extensions-sdk';
import CollectionRoute from './routes/collection.vue';
import EndpointRoute from './routes/endpoint.vue';
import HomeRoute from './routes/home.vue';
import LogRoute from './routes/log.vue';
import SettingsRoute from './routes/settings.vue';
import TransferRoute from './routes/transfer.vue';

export default defineModule({
	id: 'mock-api',
	name: 'Mock API',
	icon: 'api',
	preRegisterCheck: (user) => user.admin_access === true,
	routes: [
		{ path: '', component: HomeRoute },
		{ path: 'log', component: LogRoute },
		{ path: 'transfer', component: TransferRoute },
		{ path: 'settings', component: SettingsRoute },
		{ path: ':collectionId', component: CollectionRoute, props: true },
		{ path: ':collectionId/:endpointId', component: EndpointRoute, props: true },
	],
});
