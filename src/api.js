import { log, request } from 'directus:api'
import Prompts from './prompts'

export default {
	id: 'directus-labs-ai-writer-operation',
	handler: async ({ apiKey, model, promptKey, text, system, thread, json_mode }) => {
		try {
			system = system
			  ? [
					{
						role: 'system',
						content: system,
					}
				]
				: []
			thread = thread ?? []
			let messages = [
				...Prompts[promptKey].messages,
				...system,
				...thread,
				{
					role: "user",
					content: text
				},
			]

            let body = {
                model,
                messages,
            }

            if(json_mode) {
                body.response_format = {
                    type: 'json_object'
                }
            }

			const response = await request('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body)
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
