import type { CommandActionContext, CommandI18n } from '../command-palette';
import type { Collection } from '../utils/get-permitted-collections';
import formatTitle from '@directus/format-title';
import { defineCommands } from '../command-palette';
import { getItemRoute } from '../utils/get-item-route';
import { getPermittedCollections } from '../utils/get-permitted-collections';
import { getRouteVersionContext } from '../utils/get-route-version-context';

function collectionSingular(collection: Collection, { t, te }: CommandI18n) {
	const singularKey = `collection_names_singular.${collection.collection}`;
	const pluralKey = `collection_names_plural.${collection.collection}`;

	if (te(singularKey)) return t(singularKey);
	if (te(pluralKey)) return t(pluralKey);
	return collection.name;
}

export const contentCommands = defineCommands({
	groups: ({ stores }) =>
		getPermittedCollections(stores, 'read')
			.filter(({ type }) => type !== 'alias')
			.map(({ collection, name, meta }) => ({
				id: `collection:${collection}`,
				name: formatTitle(String(name)),
				icon: typeof meta?.icon === 'string' ? meta.icon : 'box',
			})),
	commands: ({ stores, i18n, route }) => {
		const currentPath = route.path;
		const routeCollection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const versionContext = getRouteVersionContext(route);
		const readCollections = getPermittedCollections(stores, 'read').filter(({ type }) => type !== 'alias');
		const createCollections = getPermittedCollections(stores, 'create').filter(
			({ type, meta }) => type !== 'alias' && !meta?.singleton,
		);

		return [
			...readCollections
				.filter(({ collection }) => currentPath !== `/content/${collection}`)
				.map((collection) => ({
					id: `view-collection:${collection.collection}`,
					name: `Go to ${formatTitle(String(collection.name))}`,
					icon: 'arrow_right_alt',
					group: `collection:${collection.collection}`,
					keywords: ['view', 'list'],
					priority: currentPath.startsWith(`/content/${collection.collection}`) ? 31 : 30,
					action: ({ router }: CommandActionContext) => {
						router.push(`/content/${collection.collection}`);
					},
				})),
			...createCollections
				.filter(({ collection }) => currentPath !== `/content/${collection}/+`)
				.map((collection) => ({
					id: `create-item:${collection.collection}`,
					name: `Create ${formatTitle(String(collectionSingular(collection, i18n)))}`,
					icon: 'add',
					group: `collection:${collection.collection}`,
					priority: currentPath.startsWith(`/content/${collection.collection}`) ? 21 : 20,
					action: ({ router }: CommandActionContext) => {
						const versionKey =
							routeCollection === collection.collection && versionContext.versionKey
								? versionContext.versionKey
								: undefined;

						const itemRoute = getItemRoute(
							collection.collection,
							'+',
							versionKey ? { versionKey } : undefined,
						);

						if (itemRoute) router.push(itemRoute);
					},
				})),
		];
	},
});
