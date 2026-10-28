import type { useStores } from '@directus/extensions-sdk';
import { describe, expect, it } from 'vitest';
import { isServerVersionAtLeast } from './is-server-version-at-least';

function stores(version?: string) {
	return { useServerStore: () => ({ info: { version } }) } as unknown as ReturnType<typeof useStores>;
}

describe('isServerVersionAtLeast', () => {
	it('compares major, minor, and patch numerically', () => {
		expect(isServerVersionAtLeast(stores('11.16.0'), '11.16.0')).toBe(true);
		expect(isServerVersionAtLeast(stores('11.17.4'), '11.16.0')).toBe(true);
		expect(isServerVersionAtLeast(stores('12.5.1'), '11.16.0')).toBe(true);
		expect(isServerVersionAtLeast(stores('11.6.0'), '11.16.0')).toBe(false);
		expect(isServerVersionAtLeast(stores('11.9.10'), '11.16.0')).toBe(false);
	});

	it('treats an unknown version as too old', () => {
		expect(isServerVersionAtLeast(stores(), '11.16.0')).toBe(false);
	});
});
