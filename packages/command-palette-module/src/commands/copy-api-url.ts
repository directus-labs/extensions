import { getEndpoint } from '@directus/utils';
import { defineCommands } from '../command-palette';
import { getPublicURL } from '../utils/get-root-path';
import { getRoutePrimaryKey } from '../utils/get-route-primary-key';
import { getRouteVersionContext } from '../utils/get-route-version-context';

export const copyApiUrlCommands = defineCommands({
	commands: ({ route }) => {
		const collection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const primaryKey = getRoutePrimaryKey(route.params.primaryKey);
		const versionContext = getRouteVersionContext(route);

		if (!collection || !route.path.startsWith(`/content/${collection}`)) return [];
		if (versionContext.versionKey && route.params.primaryKey === '+' && versionContext.versionId) return [];

		return [
			{
				id: 'copy-api-url',
				name: 'Copy API URL',
				icon: 'content_copy',
				group: 'context',
				priority: 50,
				action: () => {
					const endpoint = getEndpoint(collection).slice(1);
					const path = `${endpoint}${primaryKey ? `/${encodeURIComponent(primaryKey)}` : ''}`;
					const url = new URL(path, getPublicURL());

					if (primaryKey && versionContext.versionKey) {
						url.searchParams.set('version', versionContext.versionKey);
					}

					return navigator.clipboard?.writeText(url.toString());
				},
			},
		];
	},
});
