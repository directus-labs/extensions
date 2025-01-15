import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-ai-researcher-interface',
	name: 'AI Researcher',
	icon: 'memory',
	description: 'An AI agent for the purpose of content research within the Editor!',
	component: InterfaceComponent,
	group: 'other',
	localTypes: ['presentation'],
	types: ['alias'],
	options: (context) => {
		const anthropicModels = [
			{
				text: 'Claude 3.5 Sonnet',
				value: 'claude-3-5-sonnet-20240620',
			},
			{
				text: 'Claude 3 Opus',
				value: 'claude-3-opus-20240229',
			},
			{
				text: 'Claude 3 Haiku',
				value: 'claude-3-haiku-20240307',
			},
		];

		const openAiModels = [
			{
				text: 'GPT-4o',
				value: 'gpt-4o',
			},
			{
				text: 'GPT-4o mini',
				value: 'gpt-4o-mini',
			},
			{
				text: 'GPT-4 Turbo',
				value: 'gpt-4-turbo',
			},
			{
				text: 'GPT-4',
				value: 'gpt-4',
			},
			{
				text: 'GPT-3.5 Turbo',
				value: 'gpt-3.5-turbo',
			},
			{
				text: 'O1 preview (Beta, requires access)',
				value: 'o1-preview',
			},
			{
				text: 'O1 mini (Beta, requires access)',
				value: 'o1-mini',
			},
		];

		const getModels = (provider: string) => {
			if (provider === 'openai') {
				return openAiModels;
			}
			if (provider === 'anthropic') {
				return anthropicModels;
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
								text: 'Open Ai',
								value: 'openai',
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
					required: context.field.meta?.options?.aiProvider === 'anthropic',
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
					hidden: context.field.meta?.options?.aiProvider !== 'anthropic',
				},
			},
			{
				field: 'apiKeyOpenAi',
				name: 'OpenAi API Key',
				type: 'string',
				meta: {
					required: context.field.meta?.options?.aiProvider === 'openai',
					options: {
						masked: true,
					},
					width: 'full',
					interface: 'input',
					hidden: context.field.meta?.options?.aiProvider !== 'openai',
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
						choices: getModels(context.field.meta?.options?.aiProvider),
					},
					width: 'full',
					hidden: !context.field.meta?.options?.aiProvider,
				},
			},
		]
	},
});
