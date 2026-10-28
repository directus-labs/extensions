// @vitest-environment happy-dom

import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startCommandSession } from '../command-palette/registry';
import { previewCommands } from './preview';

const router = vi.hoisted(() => ({ hasRoute: vi.fn(() => true) }));
vi.mock('../utils/get-directus-router', () => ({ getDirectusRouter: () => router }));

function context(options: {
	template?: string | null;
	settings?: Record<string, unknown>;
	query?: Record<string, string>;
	primaryKey?: string;
	serverVersion?: string;
	item?: Record<string, unknown>;
	versions?: { key: string }[];
} = {}) {
	const primaryKey = options.primaryKey ?? '1';
	const get = vi.fn(async (url: string) => ({
		data: { data: url === '/versions' ? (options.versions ?? []) : (options.item ?? { slug: 'hello' }) },
	}));

	return {
		get,
		context: {
			api: { get },
			route: {
				path: `/content/articles/${primaryKey}`,
				params: { collection: 'articles', primaryKey },
				query: options.query ?? {},
			},
			stores: {
				useCollectionsStore: () => ({
					getCollection: () => ({
						meta: { preview_url: options.template === undefined ? 'http://site.test/{{slug}}?v={{$version}}' : options.template },
					}),
				}),
				usePermissionsStore: () => ({ hasPermission: () => true }),
				useServerStore: () => ({ info: { version: options.serverVersion ?? '12.5.1' } }),
				useSettingsStore: () => ({
					settings: {
						module_bar: [{ type: 'module', id: 'visual', enabled: true }],
						visual_editor_urls: [{ url: 'http://site.test' }],
						...options.settings,
					},
				}),
			},
		} as unknown as CommandAvailableContext,
	};
}

const callback = previewCommands.commands as (context: CommandAvailableContext) => CommandConfig[];

async function commandsFor(options: Parameters<typeof context>[0] = {}) {
	const { context: ctx, get } = context(options);

	// Versions, then the item, each land on a later run.
	for (let run = 0; run < 2; run++) {
		callback(ctx);
		await new Promise((resolve) => setTimeout(resolve));
	}

	return { commands: callback(ctx), get };
}

const ids = (commands: CommandConfig[]) => commands.map(({ id }) => id);

beforeEach(() => {
	startCommandSession();
	router.hasRoute.mockReturnValue(true);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('previewCommands', () => {
	it('opens Studio\'s full-page preview for the current version in a new tab', async () => {
		const open = vi.spyOn(window, 'open').mockReturnValue(null);
		const { commands } = await commandsFor({ query: { version: 'review' } });
		const resolve = vi.fn(() => ({ href: '/admin/content/articles/1/preview?version=review' }));

		commands.find(({ id }) => id === 'open-live-preview')!.action!({ router: { resolve } as any });

		expect(resolve).toHaveBeenCalledWith({ path: '/content/articles/1/preview', query: { version: 'review' } });
		expect(open).toHaveBeenCalledWith('/admin/content/articles/1/preview?version=review', '_blank', 'noopener');
	});

	it('opens the rendered preview URL in the visual editor', async () => {
		const { commands, get } = await commandsFor();
		const push = vi.fn();

		expect(ids(commands)).toEqual(['open-visual-editor', 'open-live-preview']);
		expect(get).toHaveBeenCalledWith('/items/articles/1', expect.objectContaining({ params: { fields: ['slug'] } }));

		commands[0]!.action!({ router: { push } as any });
		expect(push).toHaveBeenCalledWith('/visual/http://site.test/hello?v=published');
	});

	it('passes a saved version, and published for a draft that isn\'t saved yet, like Directus 12', async () => {
		const target = async (options: Parameters<typeof context>[0]) => {
			startCommandSession();
			const push = vi.fn();
			(await commandsFor(options)).commands[0]!.action!({ router: { push } as any });
			return push.mock.calls[0]![0];
		};

		expect(await target({ query: { version: 'draft' } })).toBe('/visual/http://site.test/hello?v=published');

		expect(await target({ query: { version: 'draft' }, versions: [{ key: 'draft' }] }))
			.toBe('/visual/http://site.test/hello?v=draft');

		expect(await target({ query: { version: 'draft' }, serverVersion: '11.17.4' }))
			.toBe('/visual/http://site.test/hello?v=draft');
	});

	it('fetches indexed relations without the index and renders with it', async () => {
		const { commands, get } = await commandsFor({
			template: 'http://site.test/{{translations[1].slug}}/{{translations.0.slug}}',
			item: { translations: [{ slug: 'en' }, { slug: 'de' }] },
		});
		const push = vi.fn();

		expect(get).toHaveBeenCalledWith('/items/articles/1', expect.objectContaining({ params: { fields: ['translations.slug'] } }));
		commands[0]!.action!({ router: { push } as any });
		expect(push).toHaveBeenCalledWith('/visual/http://site.test/de/en');
	});

	it('passes main as the published version before Directus 12', async () => {
		const { commands } = await commandsFor({ serverVersion: '11.17.4' });
		const push = vi.fn();

		commands[0]!.action!({ router: { push } as any });
		expect(push).toHaveBeenCalledWith('/visual/http://site.test/hello?v=main');
	});

	it('hides the visual editor when it can\'t open the preview', async () => {
		expect(ids((await commandsFor({ settings: { visual_editor_urls: [{ url: 'http://other.test' }] } })).commands))
			.toEqual(['open-live-preview']);

		startCommandSession();
		expect(ids((await commandsFor({ settings: { visual_editor_urls: null } })).commands)).toEqual(['open-live-preview']);
		startCommandSession();
		expect(ids((await commandsFor({ settings: { module_bar: [] } })).commands)).toEqual(['open-live-preview']);
		startCommandSession();
		expect(ids((await commandsFor({ item: {} })).commands)).toEqual(['open-live-preview']);
		startCommandSession();
		router.hasRoute.mockReturnValue(false);
		expect(ids((await commandsFor()).commands)).toEqual(['open-live-preview']);
	});

	it('is hidden without a preview URL or on new items', () => {
		expect(callback(context({ template: null }).context)).toEqual([]);
		expect(callback(context({ template: '{{$preview_base_url}}/{{slug}}' }).context)).toEqual([]);
		expect(callback(context({ primaryKey: '+' }).context)).toEqual([]);
	});

	it('resolves $preview_base_url from project settings', async () => {
		const { commands } = await commandsFor({
			template: '{{$preview_base_url}}/{{slug}}',
			settings: { preview_base_url: 'http://site.test/' },
		});
		const push = vi.fn();

		commands[0]!.action!({ router: { push } as any });
		expect(push).toHaveBeenCalledWith('/visual/http://site.test/hello');
	});
});
