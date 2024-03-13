export default {
	id: 'directus-labs-ai-image-generation',
	name: 'AI Image Generation',
	icon: 'draw',
	description: 'Use Open AI\'s Image Generation API to create new images based on user prompts.',
	overview: ({ prompt, quality, size }) => [
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
						{
							text: 'Standard',
							value: 'standard'
						},
						{
							text: 'High',
							value: 'hd'
						},
					]
				}
			}
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
						{
							text: 'Square',
							value: 'square'
						},
						{
							text: 'Portrait',
							value: 'portrait'
						},
						{
							text: 'Landscape',
							value: 'landscape'
						},
					]
				}
			}
		},
	],
};
