import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import type { RegisterCommandsOptions } from '../command-palette/registry/register-commands';
import { describe, expect, it, vi } from 'vitest';
import { deploymentsCommands } from './deployments';
import { filesCommands } from './files';
import { insightsCommands } from './insights';
import { settingsCommands } from './settings';
import { usersCommands } from './users';

vi.mock('../utils/get-directus-router', () => ({
	getDirectusRouter: () => ({ hasRoute: () => true }),
}));

function stores(options: {
	admin?: boolean;
	modules?: string[];
	permissions?: string[];
} = {}) {
	return {
		useInsightsStore: () => ({ dashboards: [] }),
		usePermissionsStore: () => ({
			hasPermission: (collection: string, action: string) =>
				options.permissions?.includes(`${collection}:${action}`) ?? false,
		}),
		useServerStore: () => ({ info: {} }),
		useSettingsStore: () => ({
			settings: {
				module_bar: options.modules?.map((id) => ({ id, type: 'module', enabled: true })) ?? [],
			},
		}),
		useUserStore: () => ({ currentUser: { id: 'user-1', admin_access: options.admin ?? false } }),
	};
}

async function availableCommands(
	registration: RegisterCommandsOptions,
	storeOverrides: ReturnType<typeof stores>,
): Promise<CommandConfig[]> {
	const callback = registration.commands;
	if (!callback) return [];
	if (typeof callback !== 'function') return callback;

	return callback({
		api: { get: vi.fn() },
		i18n: { t: vi.fn((key: string) => key), te: vi.fn(() => false) },
		route: { path: '/', params: {}, query: {} },
		search: '',
		stores: storeOverrides,
	} as unknown as CommandAvailableContext);
}

describe('command permissions', () => {
	it('does not expose module and settings commands to a denied non-admin user', async () => {
		const denied = stores();
		const registrations = [usersCommands, filesCommands, insightsCommands, deploymentsCommands, settingsCommands];

		for (const registration of registrations) {
			await expect(availableCommands(registration, denied)).resolves.toEqual([]);
		}
	});

	it('does not expose file creation when the user has read-only access', async () => {
		const readOnly = stores({
			modules: ['files'],
			permissions: ['directus_files:read'],
		});
		const commands = await availableCommands(filesCommands, readOnly);

		expect(commands.map(({ id }) => id)).toContain('search-files');
		expect(commands.map(({ id }) => id)).not.toContain('upload-file');
	});

	it('hides user commands when the users module is disabled', async () => {
		const ids = async (modules: string[]) =>
			(await availableCommands(usersCommands, stores({ admin: true, modules }))).map(({ id }) => id);

		expect(await ids([])).toEqual([]);
		expect(await ids(['users'])).toContain('search-users');
	});
});
