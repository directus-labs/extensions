export default {
	id: 'directus-labs-ai-transcription',
	name: 'AI Transcription',
	icon: 'hearing',
	description: 'Use Deepgram\'s Speech Recognition API to generate transcripts from audio files.',
	overview: ({ url }) => [
		{
			label: 'URL',
			text: url,
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
}
