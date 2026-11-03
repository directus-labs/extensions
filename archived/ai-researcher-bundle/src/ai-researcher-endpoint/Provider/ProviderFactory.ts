import type { Provider } from './Provider';
import { useEnv } from '@directus/env';
import { AiMissingKeyError } from '../index';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAiProvider } from './OpenAiProvider';

export function createProvider(provider: string, requestApiKey: string | null): Provider {
	switch (provider.toLowerCase()) {
		case 'openai': {
			const apiKey = requestApiKey || (useEnv().EXTENSION_AI_RESEARCHER_API_KEY_OPENAI as string | undefined);

			if (!apiKey) {
				throw new AiMissingKeyError();
			}

			return new OpenAiProvider(apiKey);
		}

		case 'anthropic': {
			const apiKey = requestApiKey || (useEnv().EXTENSION_AI_RESEARCHER_API_KEY_ANTHROPIC as string | undefined);

			if (!apiKey) {
				throw new AiMissingKeyError();
			}

			return new AnthropicProvider(apiKey);
		}

		default: {
			throw new Error(`Unsupported AI provider: ${provider}`);
		}
	}
}
