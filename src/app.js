import languages from './languages'

export default {
	id: 'directus-labs-ai-translation',
	name: 'AI Translation',
	icon: 'translate',
	description: 'Use DeepL\'s APIs to translate text into over 30 languages.',
	overview: ({ text, target_lang }) => [
		{
			label: 'Text',
			text: text,
		},
		{
			label: 'Target Language',
			text: languages.find(l => l.value == target_lang).text,
		},
	],
	options: [
		{
			field: 'api_key',
			name: 'DeepL API Key',
			type: 'string',
			required: true,
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					masked: true,
				},
			},
		},
		{
			field: 'api_plan',
			name: 'API Plan',
			type: 'string',
			required: true,
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'Free',
							value: 'free'
						},
						{
							text: 'Pro',
							value: 'pro'
						},
					]
				}
			}
		},
		{
			field: 'text',
			name: 'Text',
			type: 'text',
			required: true,
			meta: {
				width: 'full',
				interface: 'textarea',
			},
		},
		{
			field: 'target_lang',
			name: 'Target Language',
			type: 'string',
			required: true,
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: languages
				}
			}
		}
	],
};
