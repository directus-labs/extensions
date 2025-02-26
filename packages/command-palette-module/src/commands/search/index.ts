import type {
	Collection,
} from '../../utils/get-permitted-collections';
import formatTitle from '@directus/format-title';
import { defineCommands } from '../../command-palette';
import { useSettings } from '../../composables/use-settings';
import {
	getPermittedCollections,
} from '../../utils/get-permitted-collections';
import { isAdminFromStores } from '../../utils/is-admin';
import SearchCollectionCommand from './search-collection-command.vue';

export const searchCommands = defineCommands({
	commands({ stores }) {
		const isAdmin = isAdminFromStores(stores);
		const collections = getPermittedCollections(stores, 'read');
		const { collections: searchableCollections } = useSettings(stores);

		return searchableCollections.value
			.filter(
				({ collection }) =>
					isAdmin || collections.find((c) => c.collection === collection),
			)
			.map(({ collection }) => ({
				id: `search-collection:${collection}`,
				name: `Search ${collectionTitle(collection)}...`,
				icon: 'search',
				group: `collection:${collection}`,
				before: '*',
				component: SearchCollectionCommand,
				props: {
					collection,
				},
			}));

		function collectionTitle(collection: string) {
			let name =
        collections.find(({ collection: c }: Collection) => c === collection)?.name ?? collection;

			if (name.startsWith('directus_')) {
				name = name.replace('directus_', '');
			}

			return formatTitle(name);
		}
	},
});

export const dynamicSearchCommands = defineCommands({
	// eslint-disable-next-line unused-imports/no-unused-vars
	commands: ({ stores, search }) => {
		return [];
	},
});
