import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-video-interface',
	name: 'Video',
	icon: 'smart_display',
	description:
        'An interface to select and display a video from YouTube, Vimeo or a local file from Directus.',
	component: InterfaceComponent,
	types: ['json'],
	group: 'selection',
	options: null,
});
