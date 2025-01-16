import { Provider } from './Provider';
import { OpenAiProvider } from './OpenAiProvider';
import { AnthropicProvider } from './AnthropicProvider';

export const createProvider = (provider: string, apiKey: string): Provider => {
  switch (provider.toLowerCase()) {
    case 'openai': {
      return new OpenAiProvider(apiKey);
    }
    case 'anthropic': {
      return new AnthropicProvider(apiKey);
    }
    default: {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
};