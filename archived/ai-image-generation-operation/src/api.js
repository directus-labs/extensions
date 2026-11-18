import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-image-generation',
	handler: async ({ apiKey, prompt, quality, size }) => {
		try {
			const { size: dimensions } = [
				{ label: 'square', size: '1024x1024' },
				{ label: 'portrait', size: '1024x1792' },
				{ label: 'landscape', size: '1792x1024' },
			].find((d) => d.label === size);

			const response = await request('https://api.openai.com/v1/images/generations', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'dall-e-3',
					n: 1,
					prompt,
					quality,
					size: dimensions,
				}),
			});

			if (response.status !== 200)
				throw new Error('An error occurred when accessing OpenAI');
			return response.data.data[0].url;
		}
		catch (error) {
			log(error.message);
			throw new Error(error.message);
		}
	},
};
