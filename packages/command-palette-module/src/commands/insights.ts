import type { useStores } from '@directus/extensions-sdk';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import { defineCommands } from '../command-palette';
import { isModuleEnabled } from '../utils/is-module-enabled';
import SearchCollectionCommand from './search/search-collection-command.vue';

const group = 'collection:directus_dashboards';

export const insightsCommands = defineCommands({
	groups: ({ stores }) => {
		if (!canReadInsights(stores)) return [];
		return [{ id: group, name: 'Insights', icon: 'insights' }];
	},
	commands: ({ stores, route }): CommandConfig[] => {
		if (!canReadInsights(stores)) return [];

		const insightsStore = stores.useInsightsStore();

		return [
			{
				id: 'view-insights',
				name: 'Go to Insights',
				icon: 'insights',
				group,
				keywords: ['dashboards', 'analytics'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/insights');
				},
			},
			{
				id: 'search-dashboards',
				name: 'Search Dashboards',
				icon: 'search',
				group,
				keywords: ['search', 'find', 'insights'],
				priority: route.path.startsWith('/insights') ? 41 : 40,
				component: SearchCollectionCommand,
				props: {
					collection: 'directus_dashboards',
					collectionName: 'Insights',
					collectionIcon: 'insights',
					displayTemplate: '{{name}}',
				},
			},
			...insightsStore.dashboards.map((dashboard: any) => ({
				id: `view-dashboard:${dashboard.id}`,
				name: dashboard.name,
				icon: dashboard.icon ?? 'dashboard',
				group,
				keywords: ['dashboard', 'insights'],
				priority: 25,
				action: ({ router }: CommandActionContext) => {
					router.push(`/insights/${dashboard.id}`);
				},
			})),
		];
	},
});

function canReadInsights(stores: ReturnType<typeof useStores>) {
	return (
		isModuleEnabled(stores, 'insights')
		&& stores.usePermissionsStore().hasPermission('directus_dashboards', 'read')
	);
}
