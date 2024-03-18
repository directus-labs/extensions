import Prompts from './prompts'

export default {
	id: 'directus-labs-ai-writer-operation',
	name: 'AI Writer',
	icon: 'edit_square',
	description: 'Use OpenAI\'s Text Generation API to generate text',
	overview: ({ model, promptKey }) => [
		{
			label: 'GPT Model',
			text: model,
		},
		{
			label: 'Prompt Type',
			text: promptKey,
		},
	],
	options: (context) => {
		return {
			standard: [
				{
					field: 'apiKey',
					name: 'OpenAI API Key',
					type: 'string',
					meta: {
						required: true,
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
					meta: {
						required: true,
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
					field: 'promptKey',
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
					field: 'system',
					name: 'Custom Prompt',
					type: 'text',
					required: true,
					meta: {
						width: 'full',
						interface: 'textarea',
						hidden: context.promptKey !== Prompts.custom.value,
					},
					schema: {
						default_value: 'You are a cute little bunny called Directus that wants to help. You will act like a helpful assistant with your replies but always add some personality as if you were a bunny. Never break out of character.',
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
			// ],
			// advanced: [
				{
					field: 'thread',
					name: 'Messages',
					type: 'json',
					meta: {
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
									field: 'content',
									name: 'Message',
									type: 'string',
									meta: {
										interface: 'input',
										width: 'full',
									}
								},
							],
						},
						note: "Visit the [docs of the AI Writer Operation extension](https://github.com/directus-labs/extension-ai-writer-operation/blob/main/README.md) to learn how to use the Messages field",
					},
				},
			],
		}
	},
}
