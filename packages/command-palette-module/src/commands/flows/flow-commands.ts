import type { Flow, PrimaryKey } from '@directus/types';
import type { CommandActionContext, CommandConfig } from '../../command-palette';
import { ref } from 'vue';
import { defineCommands } from '../../command-palette';
import { useUnexpectedError } from '../../composables/use-unexpected-error';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { getRouteVersionContext } from '../../utils/get-route-version-context';
import { canRunManualFlowFromCommandPalette, triggerManualFlow } from './manual-flow';
import RunFlow from './run-flow.vue';

export const flowCommands = defineCommands({
	groups: [{ id: 'flows', name: 'Flows', icon: 'bolt' }],
	commands: ({ stores }) => {
		const userStore = stores.useUserStore();
		const isAdmin = userStore.currentUser?.admin_access ?? userStore.currentUser?.role?.admin_access ?? false;

		if (!isAdmin) return [];

		return [
			{
				id: 'create-flow',
				name: 'Create Flow',
				icon: 'add',
				group: 'flows',
				keywords: ['context'],
				action: ({ router }: CommandActionContext) => {
					router.push('/settings/flows');
				},
			},
		];
	},
});

export const collectionItemFlowCommands = defineCommands({
	groups: [{ id: 'context', name: 'Context' }],
	commands: ({ route, stores, api, i18n }) => {
		const collection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const primaryKey = getRoutePrimaryKey(route.params.primaryKey);

		if (!collection || !route.path.startsWith(`/content/${collection}`)) return [];
		if (getRouteVersionContext(route).versionKey) return [];

		const activeCollection = collection;
		const location = primaryKey ? 'item' : 'collection';
		const flowsStore = stores.useFlowsStore();
		const notificationsStore = stores.useNotificationsStore();
		const unexpectedError = useUnexpectedError({ stores, i18n });
		const flows: Flow[] = flowsStore
			.getManualFlowsForCollection(activeCollection)
			.filter(
				(flow: Flow) =>
					!flow.options?.location
					|| flow.options.location === 'both'
					|| flow.options.location === location,
			)
			.filter((flow: Flow) => canRunManualFlowFromCommandPalette(flow, location));

		return flows.map(flowCommand);

		function flowCommand(flow: Flow): CommandConfig {
			const common = {
				id: `run-flow-${flow.id}`,
				name: `Run *${flow.name}*`,
				icon: flow.icon ?? 'bolt',
				keywords: ['context'],
				group: 'context',
				endLabel: 'Flows',
				priority: 50,
			};

			if (flow.options?.requireConfirmation) {
				return { ...common, component: RunFlow, props: { flow, location } };
			}

			return {
				...common,
				action: async () => {
					try {
						const options = {
							api,
							flow,
							collection: activeCollection,
							values: null,
						};

						await (primaryKey
							? triggerManualFlow({
									...options,
									location: 'item',
									primaryKey: ref<PrimaryKey | null>(primaryKey),
								})
							: triggerManualFlow({ ...options, location: 'collection' }));

						notificationsStore.add({ title: i18n.t('run_flow_success', { flow: flow.name }) });
						await notificationsStore.refreshUnreadCount?.();
						return true;
					}
					catch (error) {
						unexpectedError(error);
						return false;
					}
				},
			};
		}
	},
});
