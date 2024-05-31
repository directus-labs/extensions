import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-experimental-m2a-interface',
	name: 'M2A Button Matrix',
	icon: 'box',
	description: 'Add a matrix button selector to the built-in M2A interface',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
