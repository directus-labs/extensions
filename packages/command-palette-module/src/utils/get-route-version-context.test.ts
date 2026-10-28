import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { describe, expect, it } from 'vitest';
import { getRouteVersionContext } from './get-route-version-context';

function route(query: Record<string, unknown>) {
	return { query } as unknown as RouteLocationNormalizedLoaded;
}

describe('getRouteVersionContext', () => {
	it('preserves a selected content version from scalar or repeated query values', () => {
		expect(getRouteVersionContext(route({ version: ['draft'], versionId: ['7'] }))).toEqual({
			versionKey: 'draft',
			versionId: '7',
		});
	});

	it('omits version context when the version key is absent', () => {
		expect(getRouteVersionContext(route({ versionId: '7' }))).toEqual({});
	});
});
