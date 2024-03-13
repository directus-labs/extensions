import Prompts from './prompts'

export default {
	id: 'directus-labs-ai-writer',
	name: 'AI Writer',
	icon: 'edit_square',
	description: 'Use OpenAI\'s GPT API to generate text',
	overview: ({ model, prompt }) => [
		{
			label: 'GPT Model',
			text: model,
		},
		{
			label: 'Prompt Type',
			text: prompt,
		},
	],
	options: {
		standard: [
			{
				field: 'apiKey',
				name: 'OpenAI API Key',
				type: 'string',
				required: true,
				meta: {
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
				},
			},
			{
				field: 'model',
				name: 'GPT Model',
				type: 'select-dropdown',
				required: true,
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'GPT-4',
								value: 'gpt-4',
							},
							{
								text: 'GPT-4 Turbo (Experimental)',
								value: 'gpt-4-turbo-preview',
							},
							{
								text: 'GPT-3.5 Turbo',
								value: 'gpt-3.5-turbo',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'prompt',
				name: 'Prompt',
				type: 'select-dropdown',
				required: true,
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							Prompts.editor,
							Prompts.microblog,
							Prompts.expander,
							Prompts.condenser,
							Prompts.seo,
							Prompts.custom,
						],
					},
					width: 'half',
				},
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
				field: 'messages',
				name: 'Messages',
				type: 'json',
				meta: {
					conditions: [
						{
							name: 'Custom Prompt',
							rule: {
								prompt: {
									_null: true,
								},
							},
						},
					],
					width: 'full',
					interface: 'list',
					options: {
						fields: [
							{
								field: 'role',
								name: 'Role',
								type: 'string',
								meta: {
									interface: 'select-dropdown',
									options: {
										choices: [
											{
												text: 'System',
												value: 'system',
											},
											{
												text: 'Assistant',
												value: 'assistant',
											},
											{
												text: 'User',
												value: 'user',
											},
										],
									},
									width: 'full',
								}
							},
							{
								field: 'message',
								name: 'Message',
								type: 'string',
								meta: {
									interface: 'input',
									width: 'full',
								}
							},
						],
					}
				},
			},
		],
	},
}
