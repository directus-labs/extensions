import type { AiWriterOperationOptions } from '../api';
import type { RequestBody } from '../types';
import { InvalidPayloadError, UnexpectedResponseError } from '@directus/errors';
import { request } from 'directus:api';
import { Provider } from './Provider';

export class OpenAi extends Provider {
	constructor(options: AiWriterOperationOptions) {
		// Determine if this is a custom OpenAI-compatible provider or standard OpenAI
		const isCustomProvider = options.aiProvider === 'openai-compatible';
		
		if (isCustomProvider) {
			if (!options.apiKeyCustom) {
				throw new InvalidPayloadError({ reason: 'Custom API Key is missing' });
			}

			if (!options.customEndpoint) {
				throw new InvalidPayloadError({ reason: 'Custom Endpoint is missing' });
			}

			// Ensure the endpoint ends with /chat/completions for OpenAI-compatible APIs
			const endpoint = options.customEndpoint.endsWith('/chat/completions') 
				? options.customEndpoint 
				: `${options.customEndpoint.replace(/\/$/, '')}/chat/completions`;

			super(options, endpoint, options.apiKeyCustom);
		} else {
			if (!options.apiKeyOpenAi) {
				throw new InvalidPayloadError({ reason: 'OpenAI API Key is missing' });
			}

			super(options, 'https://api.openai.com/v1/chat/completions', options.apiKeyOpenAi);
		}
	}

	public async messageRequest(): Promise<string> {
		const messages = this.getMessages();

		// Use custom model name if provided, otherwise use the selected model
		const modelName = this.options.model === 'custom' && this.options.customModelName 
			? this.options.customModelName 
			: this.options.model!;

		const requestBody: RequestBody = {
			model: modelName,
			messages,
			max_completion_tokens: this.options.maxToken || 0,
		};

		if (this.options.json_mode) {
			requestBody.response_format = {
				type: 'json_object',
			};
		}

		const response = await request(this.endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (response.status !== 200) {
			throw new UnexpectedResponseError();
		}

		const data = await response.data as Record<string, any>;
		return data.choices[0].message.content;
	}
}
