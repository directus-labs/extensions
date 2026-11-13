import { describe, expect, it } from 'vitest';
import { redactUrl } from './endpoint';

describe('redactUrl', () => {
	it('should replace token-like query values and keep the rest', () => {
		expect(redactUrl('/mock/bookmarks/pages?access_token=abc123&fields=*&api_key=xyz')).toBe(
			'/mock/bookmarks/pages?access_token=redacted&fields=*&api_key=redacted',
		);
	});

	it('should leave a path without a query untouched', () => {
		expect(redactUrl('/mock/bookmarks/pages')).toBe('/mock/bookmarks/pages');
	});
});
