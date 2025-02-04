import type { Accountability } from '@directus/types';
import { createError, ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { defineEndpoint } from '@directus/extensions-sdk';
import { createProvider } from './Provider/ProviderFactory';

interface DirectusRequest extends Request {
	accountability?: Accountability;
}

const AiCompletionError = createError('AI_COMPLETION_FAILED', 'AI request failed to perform a chat completion', 503);
export const AiMissingKeyError = createError('AI_KEY_MISSING', 'AI request failed due to missing API key', 503);

export default {
	id: 'ai-researcher',
	handler: defineEndpoint((router) => {
		router.post('/chat/completions', async (req: DirectusRequest, res, next) => {
			if (!req.accountability?.app) {
				return next(new ForbiddenError());
			}

			const { aiProvider, aiModel, aiKey, userMessage, messages } = req.body as Record<string, any>;

			if (!userMessage) {
				return next(new InvalidPayloadError({ reason: 'Missing userMessage parameter' }));
			}

			if (!aiProvider) {
				return next(new InvalidPayloadError({ reason: 'Missing aiProvider parameter' }));
			}

			if (!aiModel) {
				return next(new InvalidPayloadError({ reason: 'Missing aiModel parameter' }));
			}

			try {
				res.setHeader('Content-Type', 'text/event-stream');
				res.setHeader('Cache-Control', 'no-cache');
				res.setHeader('Connection', 'keep-alive');

				const provider = createProvider(aiProvider, aiKey);

				const allMessages = [...messages, { role: 'user', content: userMessage }];

				const completion = provider.createCompletion(aiModel, allMessages);

				for await (const content of completion) {
					res.write(`data: ${JSON.stringify({ content })}\n\n`);
				}

				res.write('data: [DONE]\n\n');
				res.end();
			}
			catch (error: any) {
				res.setHeader('Content-Type', 'application/json');
				console.error(error);

				if (error.code === 'AI_KEY_MISSING') {
					next(error);
				}

				next(new AiCompletionError());
			}
		});
	}),
};
