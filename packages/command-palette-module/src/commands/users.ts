import type {
	CommandActionContext,
	CommandConfig,
} from '../command-palette';
import {
	defineCommands,
} from '../command-palette';
import { isAdminFromStores } from '../utils/is-admin';

export const usersCommands = defineCommands({
	groups: [
		{
			id: 'collection:directus_users',
			name: 'Users',
		},
	],
	commands({ stores }): CommandConfig[] {
		const { usePermissionsStore } = stores;
		const permissionsStore = usePermissionsStore();
		const isAdmin = isAdminFromStores(stores);

		const hasUserReadPermissions
      = isAdmin || permissionsStore.hasPermission('directus_users', 'read');

		if (!hasUserReadPermissions)
			return [];

		return [
			hasUserReadPermissions
				? {
						id: 'view-users',
						name: 'View Users',
						icon: 'arrow_right_alt',
						group: 'collection:directus_users',
						action: ({ router }: CommandActionContext) => {
							router.push('/users');
						},
					}
				: null,
			isAdmin
				? {
						id: 'create-user',
						name: 'Create User',
						icon: 'add',
						group: 'collection:directus_users',
						action: ({ router }: CommandActionContext) => {
							router.push('/users/+');
						},
					}
				: null,
		].filter((cmd) => cmd !== null) as CommandConfig[];
	},
});
