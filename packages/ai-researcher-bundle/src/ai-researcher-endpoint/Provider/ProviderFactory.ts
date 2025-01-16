import { Provider } from './Provider';
import { OpenAiProvider } from './OpenAiProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { useEnv } from '@directus/env';
import { AiMissingKeyError } from '../index'

export const createProvider = (provider: string, requestApiKey: string | null): Provider => {
  switch (provider.toLowerCase()) {
    case 'openai': {
      let apiKey = requestApiKey || useEnv()['EXTENSION_AI_RESEARCHER_API_KEY_OPENAI'] as string | undefined;

      if (!apiKey) {
				throw new AiMissingKeyError();
      }
      
      return new OpenAiProvider(apiKey);
    }
    case 'anthropic': {
      let apiKey = requestApiKey || useEnv()['EXTENSION_AI_RESEARCHER_API_KEY_ANTHROPIC'] as string | undefined;

      if (!apiKey) {
				throw new AiMissingKeyError();
      }

      return new AnthropicProvider(apiKey);
    }
    default: {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
};