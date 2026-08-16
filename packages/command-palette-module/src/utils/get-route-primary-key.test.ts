import { describe, expect, it } from 'vitest';
import { getRoutePrimaryKey } from './get-route-primary-key';

describe('getRoutePrimaryKey', () => {
	it('excludes create and repeated-parameter routes from item actions', () => {
		expect(getRoutePrimaryKey('+')).toBeUndefined();
		expect(getRoutePrimaryKey(['1'])).toBeUndefined();
	});

	it('returns an existing item key', () => {
		expect(getRoutePrimaryKey('article-1')).toBe('article-1');
	});
});
