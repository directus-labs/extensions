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
				value: 'claude-3-5-sonnet-latest',
			},
			{
				text: 'Claude 3.5 Haiku',
				value: 'claude-3-5-haiku-latest',
			},
			{
				text: 'Claude 3 Opus',
				value: 'claude-3-opus-latest',
			},
			{
				text: 'Claude 3 Sonnet',
				value: 'claude-3-sonnet-20240229',
			},
			{
				text: 'Claude 3 Haiku',
				value: 'claude-3-haiku-20240307',
			},
		];

		const openAiModels = [
			{
				text: 'GPT-4.1',
				value: 'gpt-4.1',
			},
			{
				text: 'GPT-4.1 mini',
				value: 'gpt-4.1-mini',
			},
			{
				text: 'GPT-4.1 nano',
				value: 'gpt-4.1-nano',
			},
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
				text: 'o4-mini',
				value: 'o4-mini',
			},
			{
				text: 'o3',
				value: 'o3',
			},
			{
				text: 'o3-mini',
				value: 'o3-mini',
			},
			{
				text: 'o1',
				value: 'o1',
			},
			{
				text: 'o1-pro',
				value: 'o1-pro',
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
					note: 'Alternatively you can set the key as environment variable `EXTENSION_AI_RESEARCHER_API_KEY_ANTHROPIC`',
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
					note: 'Alternatively you can set the key as environment variable `EXTENSION_AI_RESEARCHER_API_KEY_OPENAI`',
				},
			},
			{
				field: 'aiModel',
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
			{
				field: 'inputPlaceholder',
				name: 'Placeholder',
				type: 'string',
				meta: {
					required: false,
					width: 'full',
					interface: 'system-input-translated-string',
				},
				schema: {
					default_value: 'Ask a question... / Ask a follow-up...',
				},
			},
			{
				field: 'iconLeft',
				name: '$t:icon_left',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
		];
	},
});
