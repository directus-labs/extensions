import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-pdf-viewer-interface',
	name: 'PDF',
	icon: 'box',
	description: 'View PDF files from within the item editor',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
