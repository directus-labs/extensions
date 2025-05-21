export default {
	id: 'directus-labs-ai-image-generation',
	name: 'AI Image Generation',
	icon: 'draw',
	description: 'Use OpenAI\'s Image Generation API to create new images based on user prompts.',
	overview: ({ prompt, quality, size, model }) => [
		{
			label: 'Prompt',
			text: prompt,
		},
		{
			label: 'Quality',
			text: quality,
		},
		{
			label: 'Size',
			text: size,
		},
		{
			label: 'Model',
			text: model || 'gpt-image-1',
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'OpenAI API Key',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
				options: { masked: true },
			},
		},
		{
			field: 'token',
			name: 'Directus API Token',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
				options: { masked: true },
			},
		},
		{
			field: 'publicUrl',
			name: 'Directus Public URL',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
				note: 'Root URL of your Directus instance (e.g. https://cms.example.com)',
			},
		},
		{
			field: 'model',
			name: 'Model',
			type: 'string',
			required: true,
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'GPT Image 1 (Latest)', value: 'gpt-image-1' },
						{ text: 'DALL·E 3 (Legacy)', value: 'dall-e-3' },
					],
				},
			},
		},
		{
			field: 'prompt',
			name: 'Prompt',
			type: 'text',
			required: true,
			meta: {
				width: 'full',
				interface: 'textarea',
			},
		},
		{
			field: 'quality',
			name: 'Quality',
			type: 'string',
			required: true,
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Standard', value: 'standard' },
						{ text: 'High', value: 'hd' },
					],
				},
			},
		},
		{
			field: 'size',
			name: 'Size',
			type: 'string',
			required: true,
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Square', value: 'square' },
						{ text: 'Portrait', value: 'portrait' },
						{ text: 'Landscape', value: 'landscape' },
					],
				},
			},
		},
	],
};
