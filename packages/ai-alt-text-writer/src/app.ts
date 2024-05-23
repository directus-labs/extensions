import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'directus-labs-ai-alt-text-writer-operation',
	name: 'AI Alt Text Writer',
	icon: 'image_search',
	description: 'Use Clarifai to create captions for your image files.',
	overview: ({ url }) => [
		{
			label: 'URL',
			text: url,
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'Clarifai Personal Access Token',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					iconRight: 'key',
					font: 'monospace',
					masked: true
				},
			},
		},
		{
			field: 'url',
			name: 'File URL',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					iconRight: 'link',
					font: 'monospace',
					placeholder: 'https://my.directus.app/assets/{{$trigger.key}}'
				}
			}
		}
	],
});
