import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { isItemRouteAvailable } from './is-item-route-available';

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{ path: '/content/:collection/:primaryKey', name: 'content-item', component: {} },
		{ path: '/:_(.+)+', name: 'private-404', component: {} },
	],
});

describe('isItemRouteAvailable', () => {
	it('accepts a host item route and rejects the Directus fallback route', () => {
		expect(isItemRouteAvailable(router, { path: '/content/articles/1' })).toBe(true);
		expect(isItemRouteAvailable(router, { path: '/settings/unavailable' })).toBe(false);
		expect(isItemRouteAvailable(router)).toBe(false);
	});
});
