import type { ContentVersion } from '@directus/types';
import type { CommandActionContext, CommandAvailableContext, CommandConfig } from '../command-palette';
import { defineCommands, getSessionValue } from '../command-palette';
import { getRoutePrimaryKey } from '../utils/get-route-primary-key';
import { getRouteVersionContext } from '../utils/get-route-version-context';
import { isServerVersionAtLeast } from '../utils/is-server-version-at-least';

type Version = Pick<ContentVersion, 'id' | 'key' | 'name'>;

const DRAFT = 'draft';

/** The item's saved versions, fetched like Studio's version menu, once per palette session. */
export function getItemVersions(api: CommandAvailableContext['api'], collection: string, primaryKey: string) {
	return getSessionValue(`versions:${collection}:${primaryKey}`, async (signal) => {
		const { data } = await api.get('/versions', {
			params: {
				filter: { _and: [{ collection: { _eq: collection } }, { item: { _eq: primaryKey } }] },
				sort: '-date_created',
				fields: ['*'],
			},
			signal,
		});

		return data.data as Version[];
	});
}

export const versionCommands = defineCommands({
	commands: ({ route, stores, api }): CommandConfig[] => {
		const collection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const primaryKey = getRoutePrimaryKey(route.params.primaryKey);
		if (!collection || !primaryKey || !route.path.startsWith(`/content/${collection}/`)) return [];

		const permissionsStore = stores.usePermissionsStore();
		const versioning = stores.useCollectionsStore().getCollection(collection)?.meta?.versioning === true;
		if (!versioning || !permissionsStore.hasPermission('directus_versions', 'read')) return [];

		const currentKey = getRouteVersionContext(route).versionKey;
		// Directus 11.16 added a global draft version that every versioned item can switch to before it's saved.
		const hasGlobalDraft = isServerVersionAtLeast(stores, '11.16.0');

		const versions = getItemVersions(api, collection, primaryKey);

		const commands: CommandConfig[] = [];

		if (currentKey) commands.push(switchCommand('main', 'Main', null, ['published']));

		if (hasGlobalDraft && currentKey !== DRAFT) {
			// Studio lets readers open a saved draft, but only creators can start a new one.
			const draftSaved = versions?.some(({ key }) => key === DRAFT) ?? false;

			if (draftSaved || permissionsStore.hasPermission('directus_versions', 'create')) {
				commands.push(switchCommand(DRAFT, 'Draft', DRAFT));
			}
		}

		for (const version of versions ?? []) {
			if (version.key === currentKey || (hasGlobalDraft && version.key === DRAFT)) continue;
			commands.push(switchCommand(`version:${version.id}`, version.name || version.key, version.key));
		}

		return commands;

		function switchCommand(id: string, name: string, key: string | null, keywords: string[] = []): CommandConfig {
			return {
				id: `switch-version:${id}`,
				name: `Switch to ${name}`,
				icon: 'commit',
				group: 'context',
				keywords: ['version', ...keywords],
				priority: 52,
				action: ({ router }: CommandActionContext) => {
					// Itemless versions on new items need versionId; on existing items the key alone selects the version.
					const { version: _version, versionId: _versionId, ...query } = route.query;
					router.push({ path: route.path, query: key ? { ...query, version: key } : query });
				},
			};
		}
	},
});
