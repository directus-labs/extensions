import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'image-uuid',
	name: 'Image UUID',
	icon: 'file',
	description: 'Select an image from the media library and store the UUID as a string.',
	component: InterfaceComponent,
	options: null,
	types: ['uuid'],
	system: true,
});
