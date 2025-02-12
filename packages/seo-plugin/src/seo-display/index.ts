import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
	id: 'seo-display',
	name: 'SEO Display',
	icon: 'search',
	description: 'Display SEO metadata checks. Only use with SEO Interface.',
	component: DisplayComponent,
	options: [
		{
			field: 'showSearchPreview',
			name: 'Show Search Preview',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				note: 'Show a search preview of the current page when hovering over the SEO status chip.',
			},
			schema: {
				default_value: false,
			},
		},
	],
	types: ['json'],
});
