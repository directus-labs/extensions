import type { CommandActionContext, CommandConfig } from '../../command-palette';
import { defineCommands } from '../../command-palette';
import { isAdminFromStores } from '../../utils/is-admin';
import DataModelCollections from './data-model-collections.vue';
import { getSettingsSections } from './sections';
import SettingsList from './settings-list.vue';

export const settingsCommands = defineCommands({
	groups: [{ id: 'settings', name: 'Settings', icon: 'settings' }],
	commands: ({ stores }): CommandConfig[] => {
		if (!isAdminFromStores(stores)) return [];

		return [
			{
				id: 'settings',
				name: 'Settings',
				icon: 'settings',
				group: 'settings',
				keywords: ['admin', 'configure', 'project'],
				priority: 15,
				component: SettingsList,
			},
			{
				id: 'settings:data-model',
				name: 'Data Model Settings',
				icon: 'database',
				group: 'settings',
				keywords: ['admin', 'collections', 'configure'],
				priority: 10,
				component: DataModelCollections,
			},
			...getSettingsSections(stores).map((section) => ({
				id: `settings:${section.id}`,
				name: section.name,
				icon: section.icon,
				group: 'settings',
				keywords: ['settings', 'admin'],
				priority: section.id === 'global-search' ? 10 : 5,
				action: ({ router }: CommandActionContext) => {
					router.push(section.to);
				},
			})),
		];
	},
});
