import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-whiteboard-interface',
	name: 'Whiteboard',
	icon: 'box',
	description: 'Add a field to your collection for drawing sketches and ideas',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
