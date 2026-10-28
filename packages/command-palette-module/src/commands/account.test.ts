// @vitest-environment happy-dom

import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountCommands } from './account';

function setup(options: { admin?: boolean; updateFields?: string[]; appearance?: string | null; path?: string; defaultAppearance?: string } = {}) {
	const patch = vi.fn().mockResolvedValue({});
	const hydrate = vi.fn();
	const callback = accountCommands.commands as (context: CommandAvailableContext) => CommandConfig[];

	const commands = callback({
		api: { patch },
		route: { path: options.path ?? '/content', params: {}, query: {} },
		stores: {
			useUserStore: () => ({
				currentUser: { id: 'user-1', admin_access: options.admin ?? false, appearance: options.appearance ?? null },
				hydrate,
			}),
			usePermissionsStore: () => ({
				getPermission: () => (options.updateFields ? { fields: options.updateFields } : undefined),
			}),
			// Studio reads the project default from server info; non-admins can't always read the settings.
			useServerStore: () => ({ info: { project: { default_appearance: options.defaultAppearance ?? 'auto' } } }),
		},
	} as unknown as CommandAvailableContext);

	return { commands, patch, hydrate };
}

const ids = (commands: CommandConfig[]) => commands.map(({ id }) => id);

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('accountCommands', () => {
	it('offers profile and sign out to everyone, theme only to users who can change it', () => {
		expect(ids(setup().commands)).toEqual(['my-profile', 'sign-out']);
		expect(ids(setup({ updateFields: ['first_name'] }).commands)).toEqual(['my-profile', 'sign-out']);
		expect(ids(setup({ updateFields: ['appearance'] }).commands)).toEqual(['my-profile', 'toggle-theme', 'sign-out']);
		expect(ids(setup({ admin: true }).commands)).toContain('toggle-theme');
	});

	it('hides My Profile on the profile page', () => {
		expect(ids(setup({ path: '/users/user-1' }).commands)).toEqual(['sign-out']);
	});

	it('routes to the profile and to Studio\'s logout route', () => {
		const push = vi.fn();
		const { commands } = setup();
		for (const command of commands) command.action!({ router: { push } as any });

		expect(push.mock.calls).toEqual([['/users/user-1'], ['/logout']]);
	});

	it('saves the opposite appearance on the user and reloads it', async () => {
		const run = async (options: Parameters<typeof setup>[0]) => {
			const { commands, patch, hydrate } = setup({ admin: true, ...options });
			await commands.find(({ id }) => id === 'toggle-theme')!.action!({ router: {} as any });
			expect(hydrate).toHaveBeenCalledOnce();
			return patch.mock.calls[0];
		};

		expect(await run({ appearance: 'dark' })).toEqual(['/users/me', { appearance: 'light' }]);
		expect(await run({ appearance: null, defaultAppearance: 'dark' })).toEqual(['/users/me', { appearance: 'light' }]);

		vi.stubGlobal('matchMedia', () => ({ matches: false }));
		expect(await run({ appearance: 'auto' })).toEqual(['/users/me', { appearance: 'dark' }]);
		expect(await run({ appearance: null, defaultAppearance: 'auto' })).toEqual(['/users/me', { appearance: 'dark' }]);
	});
});
