import { request } from 'directus:api'

export default {
	id: 'directus-labs-ai-transcription',
	handler: async ({ apiKey, url }) => {
		try {
			const response = await request('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
				method: 'POST',
				headers: {
					Authorization: `Token ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url })
			})
			if(response.status != 200) throw new Error('An error occurred when accessing Deepgram')
			return response.data.results.channels[0].alternatives[0]
		} catch(error) {
			log(error.message)
			throw new Error(error.message)
		}
	},
}
