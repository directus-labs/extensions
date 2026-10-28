import type { useStores } from '@directus/extensions-sdk';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import { defineCommands } from '../command-palette';
import { isAdminFromStores } from '../utils/is-admin';

const group = 'account';

export const accountCommands = defineCommands({
	groups: [{ id: group, name: 'Account', icon: 'account_circle' }],
	commands: ({ stores, api, route }): CommandConfig[] => {
		const userStore = stores.useUserStore();
		const userId = userStore.currentUser?.id;
		if (!userId) return [];

		const profilePath = `/users/${encodeURIComponent(userId)}`;
		const commands: CommandConfig[] = [];

		if (route.path !== profilePath) {
			commands.push({
				id: 'my-profile',
				name: 'My Profile',
				icon: 'account_circle',
				group,
				keywords: ['account', 'user', 'me'],
				priority: 15,
				action: ({ router }: CommandActionContext) => {
					router.push(profilePath);
				},
			});
		}

		if (canUpdateAppearance(stores)) {
			commands.push({
				id: 'toggle-theme',
				name: 'Toggle Theme',
				icon: 'contrast',
				group,
				keywords: ['appearance', 'dark', 'light', 'mode'],
				priority: 15,
				action: async () => {
					const appearance = getAppearance(stores) === 'dark' ? 'light' : 'dark';
					// Saved on the user and re-read, as Studio does when you change it on your profile.
					await api.patch('/users/me', { appearance });
					await userStore.hydrate();
				},
			});
		}

		commands.push({
			id: 'sign-out',
			name: 'Sign Out',
			icon: 'logout',
			group,
			keywords: ['log out', 'logout'],
			priority: 10,
			action: ({ router }: CommandActionContext) => {
				router.push('/logout');
			},
		});

		return commands;
	},
});

function canUpdateAppearance(stores: ReturnType<typeof useStores>) {
	if (isAdminFromStores(stores)) return true;

	const fields: string[] | null | undefined = stores.usePermissionsStore().getPermission('directus_users', 'update')?.fields;
	return fields?.includes('*') === true || fields?.includes('appearance') === true;
}

// Mirrors Studio: the user's choice, then the project default, then the browser for auto.
function getAppearance(stores: ReturnType<typeof useStores>): 'light' | 'dark' {
	const userAppearance = stores.useUserStore().currentUser?.appearance;
	const configured = userAppearance ?? stores.useServerStore().info?.project?.default_appearance ?? 'auto';
	if (configured === 'light' || configured === 'dark') return configured;

	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
