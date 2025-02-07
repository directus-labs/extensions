import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-text-intelligence',
	handler: async ({ apiKey, text }) => {
		try {
			const response = await request('https://api.deepgram.com/v1/read?language=en&intents=true&sentiment=true&summarize=true&topics=true', {
				method: 'POST',
				headers: {
					'Authorization': `Token ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ text }),
			});

			if (response.status !== 200)
				throw new Error('An error occurred when accessing Deepgram');
			return response.data.results;
		}
		catch (error) {
			log(error.message);
			throw new Error(error.message);
		}
	},
};
