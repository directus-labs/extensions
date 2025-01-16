import { defineEndpoint } from '@directus/extensions-sdk';
import { ForbiddenError, InvalidPayloadError, createError } from '@directus/errors';
import { createProvider } from './Provider/ProviderFactory';
import type { Accountability } from '@directus/types';

interface DirectusRequest extends Request {
	accountability?: Accountability;
}

const AiCompletionError = createError('AI_COMPLETION_FAILED', "AI failed to perform a chat completion", 503);
const AiMissingKeyError = createError('AI_COMPLETION_FAILED', "AI failed due to missing API key", 503);


export default {
	id: 'ai-researcher',
	handler: defineEndpoint((router) => {
		router.post('/chat/completions', async (req: DirectusRequest, res, next) => {
			if (!req.accountability?.app) {
				return next(new ForbiddenError());
			}

			const { aiProvider, aiModel, aiKey, userMessage, messages } = req.body as Record<string, any>;

			if (!userMessage) {
				return  next(new InvalidPayloadError({reason: 'Missing userMessage parameter'}));
			}
			
			if (!aiProvider) {
				return  next(new InvalidPayloadError({reason: 'Missing aiProvider parameter'}));
			}
			
			if (!aiModel) {
				return  next(new InvalidPayloadError({reason: 'Missing aiModel parameter'}));
			}

			if (!aiKey) {
				return  next(new AiMissingKeyError());
			}

			try {
				res.setHeader('Content-Type', 'text/event-stream');
				res.setHeader('Cache-Control', 'no-cache');
				res.setHeader('Connection', 'keep-alive');

				const provider = createProvider(aiProvider, aiKey);

				const allMessages = [
					...messages,
					{ role: 'user', content: userMessage }
				];

				const completion = provider.createCompletion(aiModel, allMessages);
	
				for await (const content of completion) {
					res.write(`data: ${JSON.stringify({ content })}\n\n`);
				}
		
				res.write('data: [DONE]\n\n');
				res.end();
			} catch (error) {
				next(new AiCompletionError());
			}
		});
	}),
};
