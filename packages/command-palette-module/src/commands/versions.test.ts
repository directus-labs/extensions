import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startCommandSession } from '../command-palette/registry';
import { versionCommands } from './versions';

const savedVersions = [
	{ id: 'v-draft', key: 'draft', name: null },
	{ id: 'v-review', key: 'review', name: 'Legal Review' },
	{ id: 'v-copy', key: 'copy-edit', name: null },
];

function context(options: {
	path?: string;
	primaryKey?: string;
	query?: Record<string, string>;
	serverVersion?: string;
	versioning?: boolean;
	permissions?: string[];
	versions?: typeof savedVersions;
} = {}) {
	const primaryKey = options.primaryKey ?? '1';
	const permissions = options.permissions ?? ['directus_versions:read', 'directus_versions:create'];
	const get = vi.fn().mockResolvedValue({ data: { data: options.versions ?? savedVersions } });

	return {
		get,
		context: {
			api: { get },
			route: {
				path: options.path ?? `/content/articles/${primaryKey}`,
				params: { collection: 'articles', primaryKey },
				query: options.query ?? {},
			},
			stores: {
				useCollectionsStore: () => ({
					getCollection: () => ({ meta: { versioning: options.versioning ?? true } }),
				}),
				usePermissionsStore: () => ({
					hasPermission: (collection: string, action: string) => permissions.includes(`${collection}:${action}`),
				}),
				useServerStore: () => ({ info: { version: options.serverVersion ?? '12.5.1' } }),
			},
		} as unknown as CommandAvailableContext,
	};
}

async function commandsFor(options: Parameters<typeof context>[0] = {}) {
	const { context: ctx, get } = context(options);
	const callback = versionCommands.commands as (context: CommandAvailableContext) => CommandConfig[];

	callback(ctx);
	await vi.waitFor(() => expect(get).toHaveBeenCalled());
	await new Promise((resolve) => setTimeout(resolve));

	return { commands: callback(ctx), get };
}

const names = (commands: CommandConfig[]) => commands.map(({ name }) => name);

beforeEach(() => {
	startCommandSession();
});

describe('versionCommands', () => {
	it('offers draft and every saved version on main, with core\'s versions query', async () => {
		const { commands, get } = await commandsFor();

		expect(names(commands)).toEqual(['Switch to Draft', 'Switch to Legal Review', 'Switch to copy-edit']);

		expect(get).toHaveBeenCalledWith('/versions', expect.objectContaining({
			params: {
				filter: { _and: [{ collection: { _eq: 'articles' } }, { item: { _eq: '1' } }] },
				sort: '-date_created',
				fields: ['*'],
			},
		}));
	});

	it('offers main and leaves out the current version', async () => {
		const { commands } = await commandsFor({ query: { version: 'review' } });

		expect(names(commands)).toEqual(['Switch to Main', 'Switch to Draft', 'Switch to copy-edit']);
	});

	it('leaves out draft while on it', async () => {
		const { commands } = await commandsFor({ query: { version: 'draft' } });

		expect(names(commands)).toEqual(['Switch to Main', 'Switch to Legal Review', 'Switch to copy-edit']);
	});

	it('only offers an unsaved draft to users who can create versions', async () => {
		const unsaved = savedVersions.slice(1);

		expect(names((await commandsFor({ versions: unsaved, permissions: ['directus_versions:read'] })).commands))
			.not
			.toContain('Switch to Draft');

		startCommandSession();

		expect(names((await commandsFor({ permissions: ['directus_versions:read'] })).commands))
			.toContain('Switch to Draft');
	});

	it('treats a draft key as a regular version before Directus 11.16', async () => {
		const { commands } = await commandsFor({ serverVersion: '11.6.0' });

		expect(names(commands)).toEqual(['Switch to draft', 'Switch to Legal Review', 'Switch to copy-edit']);
	});

	it('is hidden without versioning, version access, or an existing item', () => {
		const callback = versionCommands.commands as (context: CommandAvailableContext) => CommandConfig[];

		expect(callback(context({ versioning: false }).context)).toEqual([]);
		expect(callback(context({ permissions: [] }).context)).toEqual([]);
		expect(callback(context({ primaryKey: '+' }).context)).toEqual([]);
		expect(callback(context({ path: '/content/articles' }).context)).toEqual([]);
	});

	it('switches through the route query so Studio\'s unsaved-edits guard still applies', async () => {
		const { commands } = await commandsFor({ query: { version: 'review', tab: 'x' } });
		const push = vi.fn();
		const run = (name: string) => commands.find((command) => command.name === name)!.action!({ router: { push } as any });

		run('Switch to Main');
		expect(push).toHaveBeenLastCalledWith({ path: '/content/articles/1', query: { tab: 'x' } });

		run('Switch to copy-edit');
		expect(push).toHaveBeenLastCalledWith({ path: '/content/articles/1', query: { tab: 'x', version: 'copy-edit' } });
	});
});
