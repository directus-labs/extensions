import { defineOperationApp } from '@directus/extensions-sdk';
import HubSpotOptions from './options.vue';

export default defineOperationApp({
	id: 'hubspot-operation',
	name: 'HubSpot API',
	icon: 'hub',
	description: 'Use the HubSpot API to manage your data',
	overview: ({ endpoint, action }) => [
		{ label: 'Endpoint', text: endpoint },
		{ label: 'Action', text: action },
	],
	options: HubSpotOptions as any,
});