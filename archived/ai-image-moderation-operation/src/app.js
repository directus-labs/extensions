export default {
	id: 'directus-labs-image-moderation-operation',
	name: 'AI Image Moderation',
	icon: 'verified_user',
	description: 'Use Clarifai\'s Moderation Recognition model to analyze image safety.',
	overview: ({ url, threshold }) => [
		{
			label: 'URL',
			text: url,
		},
		{
			label: 'Threshold',
			text: threshold || `${80}%`,
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'Clarifai API Token',
			type: 'string',
			required: true,
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
		},
		{
			field: 'threshold',
			name: 'Threshold',
			type: 'integer',
			schema: {
				default_value: 80,
			},
			meta: {
				width: 'full',
				interface: 'slider',
				options: {
					max: 99,
					min: 1,
					step: 1,
				},
			},
		},
	],
};
