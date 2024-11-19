import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-address-completion-interface',
	name: 'Address completion',
	icon: 'box',
	description: 'Use Google Places autocomplete Data API as an Address Completion interface!',
	component: InterfaceComponent,
	options: null,
	types: ['geometry'],
});
