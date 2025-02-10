import type { VueI18n } from 'vue-i18n';
import type { CommandActionContext } from '../command-palette';
import type {
	Collection,
} from '../utils/get-permitted-collections';
import formatTitle from '@directus/format-title';
import { defineCommands } from '../command-palette';
import {
	getPermittedCollections,
} from '../utils/get-permitted-collections';

function collectionSingular(collection: Collection, { t, te }: VueI18n) {
	const singularKey = `collection_names_singular.${collection?.collection}`;
	const pluralKey = `collection_names_plural.${collection?.collection}`;

	if (te(singularKey)) {
		return t(singularKey);
	}

	if (te(pluralKey)) {
		return t(pluralKey);
	}

	return collection.name;
}

export const contentCommands = defineCommands({
	groups: ({ stores }) => {
		const permittedCollections = getPermittedCollections(stores, 'read');

		return permittedCollections.map(({ collection, name }: Collection) => ({
			id: `collection:${collection}`,
			name: formatTitle(name),
		}));
	},
	commands: ({ stores, i18n }) => {
		const readCollections = getPermittedCollections(stores, 'read');
		const createCollections = getPermittedCollections(stores, 'create');

		return [
			...createCollections.map((collection: Collection) => ({
				id: `create-item:${collection.collection}`,
				name: `Create ${formatTitle(collectionSingular(collection, i18n))}`,
				icon: 'add',
				group: `collection:${collection.collection}`,
				before: `view-collection:*`,
				action: ({ router }: CommandActionContext) => {
					router.push(`/content/${collection.collection}/+`);
				},
			})),
			...readCollections.map((collection: Collection) => ({
				id: `view-collection:${collection.collection}`,
				name: `Go to ${formatTitle(collection.name)}`,
				icon: 'arrow_right_alt',
				group: `collection:${collection.collection}`,
				keywords: ['view', 'list'],
				action: ({ router }: CommandActionContext) => {
					router.push(`/content/${collection.collection}`);
				},
			})),
		];
	},
});
