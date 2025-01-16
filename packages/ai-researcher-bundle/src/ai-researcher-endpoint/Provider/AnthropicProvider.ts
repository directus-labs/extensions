import { Provider } from './Provider';
import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../../_shared/types';

export class AnthropicProvider extends Provider {
  async* createCompletion(aiModel: string, messages: Message[]): AsyncIterableIterator<string> {
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    const completionStream = await anthropic.messages.create({
      model: aiModel,
      messages: messages as Anthropic.MessageCreateParams['messages'],
      max_tokens: 1024,
      stream: true
    });

    for await (const chunk of completionStream) {
      if (chunk.type === 'content_block_delta') {
        const delta = chunk.delta as any;
        yield delta.text || '';
      }
    }
  }
}