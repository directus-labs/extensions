import { describe, expect, it } from 'vitest';
import { getEndpoint } from './get-endpoint';

describe('getEndpoint', () => {
	it('returns the system endpoint for a system collection', () => {
		expect(getEndpoint('directus_users')).toBe('/users');
	});

	it('returns the items endpoint for a user collection', () => {
		expect(getEndpoint('user_collection')).toBe('/items/user_collection');
	});
});
