import { isObject } from '@directus/utils';
import _ from 'lodash-es';
import { UNDEFINED_VALUE } from '../../constants';

export function parseUpdate<T>(message: T) {
	const parsed: Record<string, unknown> = {};

	for (const [key, value] of _.entries(message as object)) {
		if (isObject(value)) {
			parsed[key] = parseUpdate(value as Record<string, unknown>);
		} else if (Array.isArray(value)) {
			parsed[key] = value.map((v) => (isObject(v) ? parseUpdate(v) : v));
		} else if (value === UNDEFINED_VALUE) {
			parsed[key] = undefined;
		} else {
			parsed[key] = value;
		}
	}

	return parsed as T;
}
