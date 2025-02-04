import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-image-moderation-operation',
	handler: async ({ apiKey, url, threshold = 80 }) => {
		try {
			const response = await request('https://api.clarifai.com/v2/users/clarifai/apps/main/models/moderation-recognition/outputs', {
				method: 'POST',
				headers: {
					'Authorization': `Key ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					inputs: [{
						data: {
							image: { url },
						},
					}],
				}),
			});

			if (response.status != 200)
				throw new Error('An error occurred when accessing Clarifai');

			const concepts = response.data.outputs[0].data.concepts
				.filter((c) => c.name != 'safe')
				.map((c) => ({
					name: c.name,
					value: (Number(c.value) * 100).toFixed(2),
				}));

			const flags = concepts
				.filter((c) => c.value >= threshold / 100)
				.map((c) => c.name);

			return { concepts, flags };
		}
		catch (error) {
			log(JSON.stringify(error));
			throw new Error(error.message);
		}
	},
};
