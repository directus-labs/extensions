import { request } from 'directus:api'

export default {
	id: 'directus-labs-ai-web-scraper',
	handler: async ({ apiKey, url, includeTags, excludeTags, actions, extract, formats, country, languages, mobile }) => {
		try {
			const requestUrl = 'https://api.firecrawl.dev/v1/scrape'
			
			const payload = { url }
			if(formats) payload.formats = formats
			if(includeTags) payload.includeTags = includeTags
			if(excludeTags) payload.excludeTags = excludeTags
			if(country || languages) payload.location = {}
			if(country) payload.location.country = country
			if(languages) payload.location.languages = languages
			if(mobile) payload.mobile = mobile
			if(actions) {
				payload.actions = actions.map(action => {
					const options = action.options ? JSON.parse(action.options) : {}
					return { type: action.type, ...options }
				})
			}
			if(extract) {
				payload.formats.push('extract')
				payload.extract = {
					schema: {
						type: 'object',
						properties: extract.reduce((acc, item) => ({ ...acc, [item.property]: { type: item.type } }), {}),
						required: extract.filter(item => item.required).map(item => item.property),
					}
				}
			}
			
			const response = await request(requestUrl, {
				method: 'POST',
				headers: { 
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			})

			if(response.status != 200) throw new Error('An error occurred when accessing Firecrawl')
			return response.data.data
		} catch(error) {
			throw new Error(JSON.stringify(error))
		}
	},
}
