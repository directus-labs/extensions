import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'extension-ai-text-extraction-operation',
	name: 'AI Text Extraction',
	icon: 'image_search',
	description: 'Use Clarifai to find and extract text from image files.',
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
					placeholder: 'https://mydomain/assets/{{$trigger.key}}'
				}
			}
		}
	],
});
