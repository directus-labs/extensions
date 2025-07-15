import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'related-items-interface',
	name: 'Related Items',
	icon: 'hub',
	description: 'Show related items for the current record.',
	component: InterfaceComponent,
	hideLabel: true,
	options: null,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'relational',
});
