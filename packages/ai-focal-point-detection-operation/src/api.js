import { request, log } from 'directus:api'

export default {
	id: 'directus-labs-focal-point-detection-operation',
	handler: async ({ apiKey, url }) => {
		try {
			const response = await request('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: "gpt-4o",
					max_tokens: 300,
					messages: [
					  {
						role: "user",
						content: [
						  {
							type: "text",
							text: "Look at the image and tell me what the center point for cropping should be. If the top left is the origin, please provide x,y coordinates in a json object with three properties - focal_point_x, focal_point_y, and a reason for this being the center focal point. Provide no other text - just the object. Do not format it for publishing - I want the first character of your response to be { and the last to be }. Only JSON, ready to be used in an application. To clarify - the format should be { focal_point_x: int, focal_point_y: int, reason: string }"
						  },
						  {
							type: "image_url",
							image_url: { url }
						  }
						]
					  }
					]
				  })
			})
			if(response.status != 200) throw new Error('An error occurred when accessing OpenAI')
			return JSON.parse(response.data.choices[0].message.content)
		} catch(error) {
			log(JSON.stringify(error))
			throw new Error(error.message)
		}
	},
};
