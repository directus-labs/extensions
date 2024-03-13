import { log, request } from 'directus:api'
import Prompts from './prompts'

export default {
	id: 'directus-labs-ai-writer',
	handler: async ({ apiKey, model, prompt, text }) => {
		try {
			const response = await request('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					messages: [
						...Prompts[prompt].messages,
						{
							role: "user",
							content: text
						},
					],
				})
			})
			if(response.status != 200) {
				throw new Error('An error occurred when accessing Open AI')
			}
			const choices = await response.data.choices
			return choices[0].message.content
		} catch(error) {
			log(error.message)
			throw new Error(error.message)
		}
	},
}
