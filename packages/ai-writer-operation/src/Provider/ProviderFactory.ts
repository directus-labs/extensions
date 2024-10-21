import { OpenAi } from './OpenAi';
import { Anthropic } from './Anthropic';
import { Replicate } from './Replicate';
import { InvalidPayloadError } from '@directus/errors';
import type { AiWriterOperationOptions } from "../api";


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