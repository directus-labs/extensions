import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'directus-labs-rss-to-json',
	name: 'RSS to JSON',
	icon: 'rss_feed',
	description: 'Return RSS Feeds as JSON Objects.',
	overview: ({ url }: { url: string }) => [
		{
			label: 'URL',
			text: url,
		},
	],
	options: [
		{
			field: 'url',
			name: 'URL',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});
