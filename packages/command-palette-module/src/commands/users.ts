import type { useStores } from '@directus/extensions-sdk';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import { defineCommands } from '../command-palette';
import { isAdminFromStores } from '../utils/is-admin';
import { isModuleEnabled } from '../utils/is-module-enabled';
import SearchCollectionCommand from './search/search-collection-command.vue';

export const usersCommands = defineCommands({
	groups: ({ stores }) => {
		if (!canReadUsers(stores)) return [];

		return [{ id: 'collection:directus_users', name: 'Users', icon: 'people_alt' }];
	},
	commands({ stores, route }): CommandConfig[] {
		if (!canReadUsers(stores)) return [];

		const isAdmin = isAdminFromStores(stores);
		const commands: CommandConfig[] = [
			{
				id: 'search-users',
				name: 'Search Users',
				icon: 'search',
				group: 'collection:directus_users',
				keywords: ['search', 'find', 'people'],
				priority: route.path.startsWith('/users') ? 41 : 40,
				component: SearchCollectionCommand,
				props: {
					collection: 'directus_users',
					collectionName: 'Users',
					collectionIcon: 'people_alt',
					displayTemplate: '{{first_name}} {{last_name}}',
				},
			},
		];

		if (route.path !== '/users') {
			commands.push({
				id: 'view-users',
				name: 'View Users',
				icon: 'arrow_right_alt',
				group: 'collection:directus_users',
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/users');
				},
			});
		}

		if (isAdmin && route.path !== '/users/+') {
			commands.push({
				id: 'create-user',
				name: 'Create User',
				icon: 'add',
				group: 'collection:directus_users',
				priority: 20,
				action: ({ router }: CommandActionContext) => {
					router.push('/users/+');
				},
			});
		}

		return commands;
	},
});

function canReadUsers(stores: ReturnType<typeof useStores>) {
	const permissionsStore = stores.usePermissionsStore();
	return isModuleEnabled(stores, 'users')
		&& (isAdminFromStores(stores) || permissionsStore.hasPermission('directus_users', 'read'));
}
