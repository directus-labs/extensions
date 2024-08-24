import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'system-flow-trigger-form',
	name: 'Flow',
	icon: 'bolt',
	description: 'Build a flow trigger.',
	component: InterfaceComponent,
	options: null,
	types: ['json'],
	system: true,
});
