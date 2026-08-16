type VersionOptions =
	| { versionKey: string; versionId?: string }
	| { versionKey?: never; versionId?: never };

type ItemRouteOptions = VersionOptions & {
	singleton?: boolean;
};

export interface ItemRoute {
	path: string;
	query?: { version: string; versionId?: string };
}

const systemCollectionRoutes = {
	directus_activity: { path: '/activity' },
	directus_collections: { path: '/settings/data-model' },
	directus_dashboards: { path: '/insights' },
	directus_files: { path: '/files' },
	directus_flows: { path: '/settings/flows' },
	directus_oauth_clients: { path: '/settings/mcp-oauth-clients' },
	directus_presets: { path: '/settings/presets' },
	directus_roles: { path: '/settings/roles' },
	directus_settings: { path: '/settings/project', singleton: true },
	directus_translations: { path: '/settings/translations' },
	directus_users: { path: '/users' },
} as const;

export function hasItemRoute(collection: string) {
	return !collection.startsWith('directus_') || hasSystemCollectionRoute(collection);
}

export function getItemRoute(
	collection: string,
	primaryKey: string,
	options?: ItemRouteOptions,
): ItemRoute | undefined {
	if (!hasItemRoute(collection)) return undefined;

	const systemRoute = hasSystemCollectionRoute(collection)
		? systemCollectionRoutes[collection]
		: undefined;

	const versionQuery = options?.versionKey
		? {
				version: options.versionKey,
				...(primaryKey === '+' && options.versionId ? { versionId: options.versionId } : {}),
			}
		: undefined;

	if (
		options?.singleton
		|| (systemRoute && Object.prototype.hasOwnProperty.call(systemRoute, 'singleton'))
	) {
		return {
			path: systemRoute?.path ?? `/content/${encodeURIComponent(collection)}`,
			...(versionQuery ? { query: versionQuery } : {}),
		};
	}

	const collectionPath = systemRoute?.path ?? `/content/${encodeURIComponent(collection)}`;
	const path = `${collectionPath}/${primaryKey === '+' ? '+' : encodeURIComponent(primaryKey)}`;
	return { path, ...(versionQuery ? { query: versionQuery } : {}) };
}

function hasSystemCollectionRoute(
	collection: string,
): collection is keyof typeof systemCollectionRoutes {
	return Object.prototype.hasOwnProperty.call(systemCollectionRoutes, collection);
}
