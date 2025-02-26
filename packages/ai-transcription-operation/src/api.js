import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-transcription',
	handler: async ({ apiKey, url, callback, diarize, keywords }) => {
		// Because we're in an isolate environment, we need to manually construct the URL with string concatenation
		let requestUrl = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true';
		if (callback)
			requestUrl += `&callback=${callback}`;
		if (diarize)
			requestUrl += `&diarize=${diarize}`;

		if (keywords && keywords.length > 0) {
			for (const keyword of keywords) {
				requestUrl += `&keywords=${keyword}`;
			}
		}

		try {
			const response = await request(requestUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Token ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url }),
			});

			if (response.status !== 200)
				throw new Error('An error occurred when accessing Deepgram');

			// If a callback URL was provided, we don't want to wait for the transcription to complete
			return callback
				? {
						request_id: response.data.request_id,
						message: 'Transcription request submitted for processing.',
					}
				: response.data.results.channels[0].alternatives[0];
		}
		catch (error) {
			log(error.message);
			throw new Error(error.message);
		}
	},
};
