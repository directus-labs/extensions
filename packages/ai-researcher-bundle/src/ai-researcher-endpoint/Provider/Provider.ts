import type { Message } from '../../_shared/types';

export abstract class Provider {
  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract createCompletion(aiModel: string, messages: Message[]): AsyncIterableIterator<string>;
}