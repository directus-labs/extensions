export default {
	id: 'directus-labs-focal-point-detection-operation',
	name: 'AI Focal Point Detection',
	icon: 'image_search',
	description: 'Use OpenAI\'s Vision APIs to determine the point of interest in an image',
	overview: ({ url }) => [
		{
			label: 'URL',
			text: url,
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'OpenAI API Key',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					masked: true,
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
			},
		}
	],
};
