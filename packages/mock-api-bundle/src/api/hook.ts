import type { HookConfig } from '@directus/types';
import { InvalidPayloadError } from '@directus/errors';
import { bodyError } from '../shared/engine';
import { RESPONSES } from '../shared/tables';
import { ensureSchema } from './schema';

function validateBody(payload: Record<string, any>) {
	if (!('body' in payload)) return payload;

	const error = bodyError(payload['body']);
	if (!error) return payload;

	const name = payload['name'] ? `Response "${payload['name']}"` : 'The response body';
	throw new InvalidPayloadError({ reason: `${name} isn't valid JSON: ${error}` });
}

const hook: HookConfig = ({ filter }, context) => {
	ensureSchema(context).catch(() => {});

	filter(`${RESPONSES}.items.create`, (payload) => validateBody(payload as Record<string, any>));
	filter(`${RESPONSES}.items.update`, (payload) => validateBody(payload as Record<string, any>));
};

export default hook;
