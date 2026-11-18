import type { AiWriterOperationOptions } from '../api';
import type { RequestBody } from '../types';
import { InvalidPayloadError, UnexpectedResponseError } from '@directus/errors';
import { request, sleep } from 'directus:api';
import { Provider } from './Provider';

export class Replicate extends Provider {
	constructor(options: AiWriterOperationOptions) {
		if (!options.apiKeyReplicate) {
			throw new InvalidPayloadError({ reason: 'Replicate API Key is missing' });
		}

		const modelMap: Record<string, string> = {
			'meta-llama-3.1-405b-instruct': 'meta/meta-llama-3.1-405b-instruct',
			'llama-3-8b-instruct': 'meta/llama-3-8b-instruct',
			'mistral-7b-v0.1': 'mistralai/mistral-7b-v0.1',
		};

		const path = modelMap[options.model!];

		if (!path) {
			throw new InvalidPayloadError({ reason: `Model ${options.model} not supported` });
		}

		super(options, `https://api.replicate.com/v1/models/${path}/predictions`, options.apiKeyReplicate);
	}

	public async messageRequest(): Promise<string> {
		const messages = this.getMessages();

		const requestBody: RequestBody = {
			input: {
				system_prompt: messages.filter((message) => message.role !== 'user').map((message) => message.content).join('. '),
				prompt: messages.filter((message) => message.role === 'user').map((message) => message.content).join('. '),
				max_tokens: this.options.maxToken || 0,
			},
		};

		const response = await request(this.endpoint, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (response.status !== 201) {
			throw new UnexpectedResponseError();
		}

		const data = response.data as Record<string, any>;

		if (!data?.urls?.get) {
			throw new UnexpectedResponseError();
		}

		let hasFinished = false;
		let message = '';

		while (!hasFinished) {
			await sleep(1000);
			const fetchedMessage = await this.fetchMessage(data.urls.get);
			message = fetchedMessage || '';
			hasFinished = !!fetchedMessage;
		}

		return message;
	}

	private async fetchMessage(url: string): Promise<string | false> {
		const response = await request(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		const data = response.data as Record<string, any>;

		if (data && data.completed_at) {
			return data.output.join('');
		}

		return false;
	}
}
