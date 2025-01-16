import { defineEndpoint } from '@directus/extensions-sdk';
import type { Accountability } from '@directus/types';
import { ForbiddenError } from '@directus/errors';

interface DirectusRequest extends Request {
	accountability?: Accountability;
}

export default {
	id: 'ai-researcher',
	handler: defineEndpoint((router) => {
		router.post('/chat/completions', async (req: DirectusRequest, res, next) => {
			if(!req.accountability?.app) {
				return next(new ForbiddenError());
			}
	
			res.send('Hello, World!')
		});
	}),
};
