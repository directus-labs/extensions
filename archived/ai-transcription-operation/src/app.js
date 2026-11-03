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
			meta: {
				width: 'full',
				required: true,
				interface: 'input',
				note: 'You can find or create an API key from the [Deepgram dashboard](https://console.deepgram.com/).',
				options: {
					masked: true,
				},
			},
		},
		{
			field: 'url',
			name: 'File URL',
			type: 'string',
			meta: {
				required: true,
				width: 'full',
				interface: 'input',
				note: 'Public URL of the file to transcribe.',
			},
		},
		{
			field: 'callback',
			name: 'Callback URL',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				note: 'Callback URL to provide if you would like your submitted audio to be processed asynchronously. [Learn more](https://developers.deepgram.com/docs/callback).',
			},
		},
		{
			field: 'diarize',
			name: 'Diarization',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				note: 'Indicates whether to recognize speaker changes. Defaults to `false`. [Learn more](https://developers.deepgram.com/docs/diarization).',
			},
		},
		{
			field: 'keywords',
			name: 'Keywords',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					placeholder: 'KEYWORD:INTENSIFIER and press Enter',
				},
				note: 'Uncommon proper nouns or other words to transcribe that are not a part of the model’s vocabulary. Example: `KEYWORD:INTENSIFIER`. [Learn more](https://developers.deepgram.com/docs/keywords).',
			},
		},

	],
};
