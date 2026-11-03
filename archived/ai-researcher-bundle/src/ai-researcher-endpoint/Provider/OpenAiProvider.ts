import type { Message } from '../../_shared/types';
import OpenAI from 'openai';
import { Provider } from './Provider';

export class OpenAiProvider extends Provider {
	async *createCompletion(aiModel: string, messages: Message[]): AsyncIterableIterator<string> {
		const openai = new OpenAI({
			apiKey: this.apiKey,
		});

		const completionStream = await openai.chat.completions.create({
			model: aiModel,
			messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
			stream: true,
		});

		for await (const chunk of completionStream) {
			const content = chunk.choices[0]?.delta?.content || '';
			yield content;
		}
	}
}
