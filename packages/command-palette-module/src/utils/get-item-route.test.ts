import { describe, expect, it, vi } from 'vitest';
import { getItemRoute } from './get-item-route';

const mocks = vi.hoisted(() => ({ hasFlowsModule: false }));

vi.mock('./get-directus-router', () => ({
	getDirectusRouter: () => ({ hasRoute: (name: string) => name === 'flows-collection' && mocks.hasFlowsModule }),
}));

describe('getItemRoute', () => {
	it.each<[string, string, string]>([
		['directus_activity', '1', '/activity/1'],
		['directus_collections', 'articles', '/settings/data-model/articles'],
		['directus_dashboards', 'dashboard-1', '/insights/dashboard-1'],
		['directus_files', 'file-1', '/files/file-1'],
		['directus_flows', 'flow-1', '/settings/flows/flow-1'],
		['directus_oauth_clients', 'client-1', '/settings/mcp-oauth-clients/client-1'],
		['directus_presets', 'preset-1', '/settings/presets/preset-1'],
		['directus_roles', 'role-1', '/settings/roles/role-1'],
		['directus_translations', 'translation-1', '/settings/translations/translation-1'],
		['directus_users', 'user-1', '/users/user-1'],
	])('uses the Studio route for %s', (collection, primaryKey, path) => {
		expect(getItemRoute(collection, primaryKey)).toEqual({ path });
	});

	it('uses the v12 flows module route when the host has it', () => {
		mocks.hasFlowsModule = true;
		expect(getItemRoute('directus_flows', 'flow-1')).toEqual({ path: '/flows/flow-1' });
		mocks.hasFlowsModule = false;
	});

	it('uses the singleton route without appending a primary key', () => {
		expect(getItemRoute('directus_settings', '1')).toEqual({ path: '/settings/project' });
		expect(getItemRoute('homepage', '1', { singleton: true })).toEqual({ path: '/content/homepage' });

		expect(getItemRoute('homepage', '+', {
			singleton: true,
			versionKey: 'draft',
			versionId: 'version-1',
		})).toEqual({
			path: '/content/homepage',
			query: { version: 'draft', versionId: 'version-1' },
		});
	});

	it('keeps valid version context on custom collection routes', () => {
		expect(getItemRoute('articles', '+', { versionKey: 'draft', versionId: 'version-1' })).toEqual({
			path: '/content/articles/+',
			query: { version: 'draft', versionId: 'version-1' },
		});

		expect(getItemRoute('articles', '1', { versionKey: 'draft', versionId: 'ignored' })).toEqual({
			path: '/content/articles/1',
			query: { version: 'draft' },
		});
	});

	it('encodes custom collection and primary-key path segments', () => {
		expect(getItemRoute('news items', 'a/b')).toEqual({ path: '/content/news%20items/a%2Fb' });
	});

	it('returns routine absence for system collections without an item route', () => {
		expect(getItemRoute('directus_permissions', '1')).toBeUndefined();
	});
});
