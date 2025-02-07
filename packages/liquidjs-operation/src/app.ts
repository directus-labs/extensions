import { defineOperationApp } from '@directus/extensions-sdk';
import options from './options.vue';

export default defineOperationApp({
	id: 'liquidjs-operation',
	name: 'Liquid Template',
	icon: 'water_drop',
	description: 'Render dynamic content using Liquid templates.',
	overview: ({ text }) => [
		{
			label: 'Text',
			text,
		},
	],
	options,
});
