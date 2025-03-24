import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'collaborative-editing',
	name: 'Collaborative Editing',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: null,
	types: ['string'],
});
