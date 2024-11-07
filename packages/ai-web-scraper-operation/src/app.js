export default {
	id: 'directus-labs-ai-web-scraper',
	name: 'AI Web Scraper',
	icon: 'local_fire_department',
	description: 'Use Firecrawl\'s Web Scraping API to extract data from websites.',
	overview: ({ url, extract }) => [
		{
			label: 'URL',
			text: url,
		},
		{
			label: 'Extract',
			text: extract ? extract.map(item => item.property).join(', ') : 'Metadata Only',
		},
	],
	options: [
		{
			field: 'apiKey',
			name: 'Firecrawl API Key',
			type: 'string',
			meta: {
				width: 'full',
        required: true,
				interface: 'input',
        note: 'You can find or create an API key from the [Firecrawl dashboard](https://www.firecrawl.dev/app).',
				options: {
					masked: true,
				},
			},
		},
		{
			field: 'url',
			name: 'Website URL',
			type: 'string',
			meta: {
        required: true,
				width: 'full',
				interface: 'input',
        note: 'Public URL of the page or PDF to scrape.',
			},
		},
		{
			field: 'country',
			name: 'Country',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
        note: 'ISO 3166-1 alpha-2 country code. Defaults to <code>US</code>.',
			},
		},
		{
			field: 'languages',
			name: 'Languages',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'tags',
        note: 'An array of languages/locales. Defaults to location language.',
			},
		},
		{
			field: 'includeTags',
			name: 'Include Tags',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					placeholder: 'Enter DOM selectors and press enter to add.',
					iconRight: '',
				}
			},
		},
		{
			field: 'excludeTags',
			name: 'Exclude Tags',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					placeholder: 'Enter DOM selectors and press enter to add.',
					iconRight: '',
				}
			},
		},
		{
			field: 'actions',
			name: 'Actions Before Scraping',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'list',
				options: {
					fields: [
						{
							field: 'type',
							name: 'Type',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'select-dropdown',
								required: true,
								options: {
									choices: [
										{ text: 'Click', value: 'click' },
										{ text: 'Press', value: 'press' },
										{ text: 'Screenshot', value: 'screenshot' },
										{ text: 'Scroll', value: 'scroll' },
										{ text: 'Wait', value: 'wait' },
										{ text: 'Write', value: 'write' },
									],
								},
							},
						},
						{
							field: 'options',
							name: 'Options',
							type: 'text',
							default: "{}",
							meta: {
								width: 'full',
								interface: 'input-code',
								note: 'Refer to the <a href="https://docs.firecrawl.dev/api-reference/endpoint/scrape" target="_blank">Firecrawl API reference</a> for each action\'s available options.',
								options: {
									language: 'json',
								}
							},
						}
					],
				}
			},
		},
		{
			field: 'extract',
			name: 'Data to Extract',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'list',
				options: {
					fields: [
						{
							field: 'property',
							name: 'Property Description',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'input',
								required: true,
								note: 'Describe the property you want to extract from the website as a key. Use underscores instead of spaces.',
							},
						},
						{
							field: 'type',
							name: 'Data Type',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								required: true
							},
						},
						{
							field: 'required',
							name: 'Required',
							type: 'boolean',
							default: true,
							meta: {
								width: 'half',
								interface: 'toggle'
							},
						},
					],
				}
			},
		},
		{
			field: 'formats',
			name: 'Additional Formats',
			type: 'json',
			meta: {
				width: 'half',
				interface: 'select-multiple-dropdown',
				note: 'Basic page metadata will always be included.',
				options: {
					allowNone: true,
					choices: [
						{ text: 'Markdown', value: 'markdown' },
						{ text: 'HTML', value: 'html' },
						{ text: 'Raw HTML', value: 'rawHtml' },
						{ text: 'Links', value: 'links' },
						{ text: 'Scrape', value: 'scrape' },
						{ text: 'Screenshot', value: 'screenshot' },
						{ text: 'Extract', value: 'extract' },
						{ text: 'Screenshot (Full Page)', value: 'screenshot@fullPage' },
					]
				}
			},
		},
		{
			field: 'mobile',
			name: 'Mobile',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				note: 'Emulate scraping from a mobile device.',
			},
		},
	],
}