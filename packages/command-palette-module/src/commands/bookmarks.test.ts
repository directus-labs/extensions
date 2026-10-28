import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import { describe, expect, it, vi } from 'vitest';
import { bookmarkCommands } from './bookmarks';

const bookmarks = [
	{ id: 1, collection: 'articles', bookmark: 'Drafts', icon: 'edit' },
	{ id: 2, collection: 'secrets', bookmark: 'Hidden' },
	{ id: 3, collection: 'articles', bookmark: '$t:published', icon: null },
];

function commands(query: Record<string, string> = {}) {
	const callback = bookmarkCommands.commands as (context: CommandAvailableContext) => CommandConfig[];

	return callback({
		i18n: { t: (key: string) => `t(${key})`, te: () => true },
		route: { path: '/content/articles', params: {}, query },
		stores: {
			useCollectionsStore: () => ({ visibleCollections: [{ collection: 'articles', name: 'articles' }, { collection: 'secrets', name: 'secrets' }] }),
			usePermissionsStore: () => ({ hasPermission: (collection: string) => collection === 'articles' }),
			usePresetsStore: () => ({ bookmarks }),
		},
	} as unknown as CommandAvailableContext);
}

describe('bookmarkCommands', () => {
	it('lists readable bookmarks with their collection and translated names', () => {
		expect(commands().map(({ name, icon }) => [name, icon])).toEqual([
			['Articles: Drafts', 'edit'],
			['Articles: t(published)', 'bookmark'],
		]);
	});

	it('opens the bookmark the way the content navigation does', () => {
		const push = vi.fn();
		commands()[0]!.action!({ router: { push } as any });

		expect(push).toHaveBeenCalledWith({ path: '/content/articles', query: { bookmark: '1' } });
	});

	it('leaves out the bookmark already open', () => {
		expect(commands({ bookmark: '1' }).map(({ id }) => id)).toEqual(['bookmark:3']);
	});
});
