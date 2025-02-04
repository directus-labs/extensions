import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-translation',
	handler: async ({ api_key, api_plan, text, target_lang }) => {
		try {
			const url = `https://api${api_plan == 'free' ? '-free' : ''}.deepl.com/v2/translate`;

			const response = await request(url, {
				method: 'POST',
				headers: {
					'Authorization': `DeepL-Auth-Key ${api_key}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: [text],
					target_lang,
				}),
			});

			if (response.status != 200)
				throw new Error('An error occurred when accessing DeepL');
			return response.data.translations[0].text;
		}
		catch (error) {
			log(error.message);
			throw new Error(error.message);
		}
	},
};
