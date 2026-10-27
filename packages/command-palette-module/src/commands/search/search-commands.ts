import type { Collection } from '../../utils/get-permitted-collections';
import formatTitle from '@directus/format-title';
import { defineCommands } from '../../command-palette';
import { useSettings } from '../../composables/use-settings';
import { getDirectusRouter } from '../../utils/get-directus-router';
import { getItemRoute } from '../../utils/get-item-route';
import { getPermittedCollections } from '../../utils/get-permitted-collections';
import { isItemRouteAvailable } from '../../utils/is-item-route-available';
import SearchCollectionCommand from './search-collection-command.vue';

export const searchCommands = defineCommands({
	commands: ({ stores, route }) => {
		const router = getDirectusRouter();
		const collections = getPermittedCollections(stores, 'read').filter(({ collection, type, meta }) => {
			// Singleton endpoints return an object, not a list to search through.
			if (type === 'alias' || meta?.singleton) return false;

			const itemRoute = getItemRoute(collection, '__command-palette-route-check__');
			return router !== undefined && isItemRouteAvailable(router, itemRoute);
		});
		const { collections: searchSettings } = useSettings(stores);
		const settingsByCollection = new Map(searchSettings.value.map((config) => [config.collection, config]));

		return collections.map((collection: Collection) => {
			const config = settingsByCollection.get(collection.collection);

			return {
				id: `search-collection:${collection.collection}`,
				name: `Search ${formatTitle(String(collection.name))}...`,
				icon: 'search',
				group: `collection:${collection.collection}`,
				keywords: ['search', 'find'],
				priority: route.path.startsWith(`/content/${collection.collection}`) ? 41 : 40,
				component: SearchCollectionCommand,
				props: {
					collection: collection.collection,
					collectionName: String(collection.name),
					collectionIcon: (collection.meta?.icon ?? 'box') as string,
					displayTemplate: config?.displayTemplate ?? collection.meta?.display_template ?? null,
				},
			};
		});
	},
});
