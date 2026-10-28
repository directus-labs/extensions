import type { useStores } from '@directus/extensions-sdk';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import { defineCommands } from '../command-palette';
import { isModuleEnabled } from '../utils/is-module-enabled';
import SearchCollectionCommand from './search/search-collection-command.vue';

const group = 'collection:directus_files';

export const filesCommands = defineCommands({
	groups: ({ stores }) => {
		if (!canReadFiles(stores)) return [];
		return [{ id: group, name: 'File Library', icon: 'folder' }];
	},
	commands: ({ stores, route }): CommandConfig[] => {
		if (!canReadFiles(stores)) return [];

		const permissionsStore = stores.usePermissionsStore();
		const commands: CommandConfig[] = [
			{
				id: 'view-files',
				name: 'Go to File Library',
				icon: 'folder',
				group,
				keywords: ['files', 'library', 'media'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/files');
				},
			},
			{
				id: 'search-files',
				name: 'Search Files',
				icon: 'search',
				group,
				keywords: ['search', 'find', 'media'],
				priority: route.path.startsWith('/files') ? 41 : 40,
				component: SearchCollectionCommand,
				props: {
					collection: 'directus_files',
					collectionName: 'File Library',
					collectionIcon: 'folder',
					displayTemplate: '{{title}}',
				},
			},
			...[
				['view-all-files', 'All Files', 'file_copy', '/files/all'],
				['view-my-files', 'My Files', 'folder_shared', '/files/mine'],
				['view-recent-files', 'Recent Files', 'history', '/files/recent'],
			].map(([id, name, icon, path]) => ({
				id: id!,
				name: name!,
				icon: icon!,
				group,
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push(path!);
				},
			})),
		];

		if (permissionsStore.hasPermission('directus_files', 'create')) {
			commands.push({
				id: 'upload-file',
				name: 'Upload File',
				icon: 'add',
				group,
				keywords: ['add', 'create', 'files'],
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/files/+');
				},
			});
		}

		return commands;
	},
});

function canReadFiles(stores: ReturnType<typeof useStores>) {
	return isModuleEnabled(stores, 'files') && stores.usePermissionsStore().hasPermission('directus_files', 'read');
}
