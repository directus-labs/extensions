export default {
	id: 'directus-labs-ai-text-intelligence',
	name: 'AI Text Intelligence',
	icon: 'menu_book',
	description: 'Use Deepgram\'s Text Intelligence API to analyze text.',
	overview: ({ text }) => [
		{
			label: 'Text',
			text: text,
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'Deepgram API Key',
			type: 'string',
			required: true,
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
		{
			field: 'text',
			name: 'Text',
			type: 'text',
			required: true,
			meta: {
				width: 'full',
				interface: 'textarea',
			},
		},
	],
};
