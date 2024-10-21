import { Provider } from './Provider';
import { InvalidPayloadError, UnexpectedResponseError } from '@directus/errors';
import { request } from 'directus:api';
import type { AiWriterOperationOptions } from '../api';
import type { RequestBody } from '../types';

export class Anthropic extends Provider {
  
  constructor(options: AiWriterOperationOptions) {
    if (!options.apiKeyAnthropic) {
      throw new InvalidPayloadError({ reason: 'Anthropic API Key is missing' });
    }

    super(options, 'https://api.anthropic.com/v1/messages', options.apiKeyAnthropic);
  }


  public async messageRequest(): Promise<string> {
    const messages = this.getMessages();
    
    const requestBody: RequestBody = {
      model: this.options.model!,
      messages,
      max_tokens: this.options.maxToken || 0,
    };

    const response = await request(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status != 200) {
      throw new UnexpectedResponseError();
    }

    const data = await response.data as Record<string, any>;
    return data.content[0].text;
  }

}