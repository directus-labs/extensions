import speakers from './speakers'

export default {
	id: 'directus-labs-ai-speech-generation',
	name: 'AI Speech Generation',
	icon: 'record_voice_over',
	description: 'Use the Genny TTS API to create realistic speech clips.',
	overview: ({ text, speaker }) => [
		{
			label: 'Text',
			text: text,
		},
		{
			label: 'Speaker',
			text: speakers.find(s => s.value == speaker).text,
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'Genny API Key',
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
			field: 'text',
			name: 'Text',
			type: 'text',
			schema: {
				max_length: 500
			},
			meta: {
				width: 'full',
				interface: 'textarea',
				note: 'Maximum 500 characters',
				options: {
					softLength: 500,
					trim: true
				}
			},
		},
		{
			field: 'speaker',
			name: 'Speaker',
			type: 'string',
			required: true,
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: speakers
				}
			}
		},
		{
			field: 'speed',
			name: 'Speed',
			type: 'float',
			meta: {
				width: 'half',
				interface: 'slider',
				options: {
					max: 3.0,
					min: 0.1,
					step: 0.1
				}
			},
		},
	],
};
