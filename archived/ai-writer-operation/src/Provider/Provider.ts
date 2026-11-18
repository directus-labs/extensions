import type { AiWriterOperationOptions } from '../api';
import type { message } from '../types';
import { InvalidPayloadError } from '@directus/errors';
import Prompts from '../prompts';

export abstract class Provider {
	protected options: AiWriterOperationOptions;
	protected endpoint: string;
	protected apiKey: string;

	constructor(options: AiWriterOperationOptions, endpoint: string, apiKey: string) {
		if (!options.model) {
			throw new InvalidPayloadError({ reason: 'AI Model is missing' });
		}

		if (!options.text) {
			throw new InvalidPayloadError({ reason: 'Text is missing' });
		}

		this.options = options;
		this.endpoint = endpoint;
		this.apiKey = apiKey;
	}

	protected getMessages(): message[] {
		const messages = [] as message[];

		if (this.options.promptKey && this.options.promptKey in Prompts) {
			const prompt = Prompts[this.options.promptKey];

			if (prompt && prompt.messages) {
				messages.push(...prompt.messages);
			}
		}

		if (this.options.system) {
			messages.push({
				role: 'system',
				content: this.options.system,
			});
		}

		if (this.options.thread) {
			messages.push(...this.options.thread);
		}

		messages.push({
			role: 'user',
			content: this.options.text!,
		});

		return messages;
	};

	public abstract messageRequest(): Promise<string>;
}
