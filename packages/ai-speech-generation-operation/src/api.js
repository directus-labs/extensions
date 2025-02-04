import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-speech-generation',
	handler: async ({ apiKey, text, speaker, speed }) => {
		try {
			const response = await request('https://api.genny.lovo.ai/api/v1/tts/sync', {
				method: 'POST',
				headers: {
					'X-API-KEY': apiKey,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ text, speaker, speed }),
			});

			if (response.status != 201)
				throw new Error('An error occurred when accessing Genny');
			return response.data.data[0].urls[0];
		}
		catch (error) {
			log(JSON.stringify(error));
			throw new Error(error.message);
		}
	},
};
