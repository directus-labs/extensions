import type { AiWriterOperationOptions } from '../api';
import { InvalidPayloadError } from '@directus/errors';
import { Anthropic } from './Anthropic';
import { OpenAi } from './OpenAi';
import { Replicate } from './Replicate';

export function getProvider(options: AiWriterOperationOptions) {
	if (!options.aiProvider) {
		throw new InvalidPayloadError({ reason: 'AI Provider is missing' });
	}

	if (options.aiProvider.toLowerCase() === 'anthropic') {
		return new Anthropic(options);
	}

	if (options.aiProvider.toLowerCase() === 'openai') {
		return new OpenAi(options);
	}

	if (options.aiProvider.toLowerCase() === 'replicate') {
		return new Replicate(options);
	}

	throw new Error(`Unsoported AI Provider ${options.aiProvider}`);
}
