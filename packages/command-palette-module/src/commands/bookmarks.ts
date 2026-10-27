import type { Preset } from '@directus/types';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import formatTitle from '@directus/format-title';
import { defineCommands } from '../command-palette';
import { getPermittedCollections } from '../utils/get-permitted-collections';
import { getRouteQueryValue } from '../utils/get-route-query-value';

const group = 'bookmarks';

export const bookmarkCommands = defineCommands({
	groups: [{ id: group, name: 'Bookmarks', icon: 'bookmark' }],
	commands: ({ stores, route, i18n }): CommandConfig[] => {
		const collections = new Map(
			getPermittedCollections(stores, 'read')
				.filter(({ type }) => type !== 'alias')
				.map((collection) => [collection.collection, collection]),
		);
		const currentBookmark = getRouteQueryValue(route.query.bookmark);

		// The presets store already scopes bookmarks to the user, their role, and global ones.
		return (stores.usePresetsStore().bookmarks as Preset[])
			.filter(({ id, collection, bookmark }) =>
				bookmark && collection && collections.has(collection) && String(id) !== currentBookmark)
			.map(({ id, collection, bookmark, icon }) => {
				const path = `/content/${encodeURIComponent(collection!)}`;
				const name = bookmark!.startsWith('$t:') ? i18n.t(bookmark!.slice(3)) : bookmark!;

				return {
					id: `bookmark:${id}`,
					name: `${formatTitle(String(collections.get(collection!)!.name))}: ${name}`,
					icon: icon ?? 'bookmark',
					group,
					keywords: ['bookmark', 'preset'],
					priority: 25,
					action: ({ router }: CommandActionContext) => {
						router.push({ path, query: { bookmark: String(id) } });
					},
				};
			});
	},
});
