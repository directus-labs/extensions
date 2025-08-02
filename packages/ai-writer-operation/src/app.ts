import { defineOperationApp } from '@directus/extensions-sdk';
import Prompts from './prompts';

export default defineOperationApp({
	id: 'directus-labs-ai-writer-operation',
	name: 'AI Writer',
	icon: 'edit_square',
	description: 'Use Anthropic, OpenAI, and Replicate APIs to generate text',
	overview: ({ model, promptKey, aiProvider }) => [
		{
			label: 'AI  Provider',
			text: aiProvider,
		},
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
		const anthropicModels = [
			{ text: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet-latest' },
			{ text: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
			{ text: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-latest' },
			{ text: 'Claude 3.5 Opus', value: 'claude-3-5-opus-latest' },
			{ text: 'Claude 3 Opus', value: 'claude-3-opus-latest' },
			{ text: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
			{ text: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
		];

		const openAiModels = [
			{ text: "GPT-4o", value: "gpt-4o" },
			{ text: "GPT-4 Turbo", value: "gpt-4-turbo" },
			{ text: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
		];

		const replicateModels = [
			{ text: 'Meta Llama 3.1 405B Instruct', value: 'meta-llama-3.1-405b-instruct' },
			{ text: 'Meta Llama 3 8B Instruct', value: 'llama-3-8b-instruct' },
			{ text: 'Mistral 7B v0.1', value: 'mistral-7b-v0.1' },
		];

		const getModels = (provider: string) => {
			if (provider === 'openai') {
				return openAiModels;
			}

			if (provider === 'anthropic') {
				return anthropicModels;
			}

			if (provider === 'replicate') {
				return replicateModels;
			}

			return [];
		};

		return [
			{
				field: 'aiProvider',
				name: 'AI Provider',
				type: 'string',
				meta: {
					required: true,
					width: 'full',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'Anthropic',
								value: 'anthropic',
							},
							{
								text: 'Open AI',
								value: 'openai',
							},
							{
								text: 'Replicate (Meta & Mistral)',
								value: 'replicate',
							},
						],
					},
				},
			},
			{
				field: 'apiKeyAnthropic',
				name: 'Anthropic API Key',
				type: 'string',
				meta: {
					required: context.aiProvider === 'anthropic',
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
					hidden: context.aiProvider !== 'anthropic',
				},
			},
			{
				field: 'apiKeyOpenAi',
				name: 'OpenAi API Key',
				type: 'string',
				meta: {
					required: context.aiProvider === 'openai',
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
					hidden: context.aiProvider !== 'openai',
				},
			},
			{
				field: 'apiKeyReplicate',
				name: 'Replicate API Key',
				type: 'string',
				meta: {
					required: context.aiProvider === 'replicate',
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
					hidden: context.aiProvider !== 'replicate',
				},
			},
			{
				field: 'model',
				name: 'AI Model',
				type: 'string',
				meta: {
					required: true,
					interface: 'select-dropdown',
					options: {
						allowOther: true,
						choices: getModels(context.aiProvider),
					},
					width: 'half',
				},
			},
			{
				field: 'maxToken',
				name: 'Max Token',
				type: 'integer',
				meta: {
					required: true,
					interface: 'input',
					width: 'half',
					note: 'Based on the provider & model this will be either the total max token or the max complection tokens.',
				},
				schema: {
					default_value: 1024,
				},
			},
			{
				field: 'promptKey',
				name: 'Prompt',
				type: 'string',
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
					hidden: context.promptKey !== Prompts.custom!.value,
				},
				schema: {
					default_value: 'You are a cute little bunny called Directus that wants to help. You will act like a helpful assistant with your replies but always add some personality as if you were a bunny. Never break out of character.',
				},
			},
			{
				field: 'json_mode',
				name: 'JSON Mode',
				type: 'boolean',
				meta: {
					width: 'full',
					hidden: context.promptKey !== Prompts.custom!.value,
					note: 'Always return a JSON object. Make sure your selected AI-Provider and model support JSON mode. See the [OpenAI docs on JSON mode](https://platform.openai.com/docs/guides/text-generation/json-mode) for more information.',
				},
				schema: {
					default_value: false,
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
								},
							},
							{
								field: 'content',
								name: 'Message',
								type: 'text',
								meta: {
									interface: 'textarea',
									width: 'full',
								},
							},
						],
					},
					note: 'Visit the [docs of the AI Writer Operation extension](https://github.com/directus-labs/extension-ai-writer-operation/blob/main/README.md) to learn how to use the Messages field',
				},
			},
		];
	},
});
