import type { Flow } from '@directus/types';
import type {
	CommandActionContext,
	CommandConfig,
} from '../../command-palette';
import {
	defineCommands,
} from '../../command-palette';
import { useUnexpectedError } from '../../composables/use-unexpected-error';
import RunFlow from './run-flow.vue';

export const flowCommands = defineCommands({
	groups: [
		{
			id: 'flows',
			name: 'Flows',
		},
	],
	commands: ({ stores }) => {
		const { useUserStore } = stores;
		const userStore = useUserStore();

		const isAdmin =
      userStore.currentUser?.admin_access ?? userStore.currentUser?.role?.admin_access ?? false;

		return [
			// {
			//   id: "run-manual-flow",
			//   name: "Run Manual Flow...",
			//   icon: "bolt",
			//   group: "flows",
			//   component: SearchRunFlows,
			// },
			...(isAdmin
				? [
						{
							id: 'create-flow',
							name: 'Create Flow',
							icon: 'add',
							group: 'flows',
							action: ({ router }: CommandActionContext) => {
								router.push('/settings/flows');
							},
						},
					]
				: []),
		];
	},
});

export const collectionItemFlowCommands = defineCommands({
	groups: [
		{
			id: 'context',
			name: 'Context',
		},
	],
	commands: ({ route, stores, api, i18n }) => {
		const { t } = i18n;

		const { collection, primaryKey } = route.params as {
			collection: string | undefined;
			primaryKey: string | undefined;
		};

		if (!collection) {
			return [];
		}

		const location = primaryKey ? 'item' : 'collection';

		const { useFlowsStore, useNotificationsStore } = stores;
		const unexpectedError = useUnexpectedError({ stores, i18n });
		const flowsStore = useFlowsStore();
		const notificationsStore = useNotificationsStore();

		const flows: Flow[] = flowsStore
			.getManualFlowsForCollection(collection)
			.filter(
				(flow: Flow) =>
					!flow.options?.location
					|| flow.options?.location === 'both'
					|| flow.options?.location === location,
			)
		// We don't currently support selecting items from within the command palette, so all flow
		// that require a selection are hidden on the collection page
			.filter(
				(flow: Flow) =>
					location === 'item' || flow.options?.requireSelection === false,
			);

		return flows.map(flowCommand);

		function flowCommand(flow: Flow): CommandConfig {
			const common = {
				id: `run-flow-${flow.id}`,
				name: `Run *${flow.name}*`,
				icon: flow.icon ?? 'bolt',
				keywords: ['context'],
				group: 'context',
			};

			return !flow.options?.requireConfirmation
				? {
						...common,
						action: async () => {
							try {
								await api.post(`/flows/trigger/${flow.id}`, {
									collection,
									...(flow.options?.requireSelection === false
										? {}
										: { keys: [primaryKey] }),
								});

								notificationsStore.add({
									title: t('run_flow_success', { flow: flow.name }),
								});
							}
							catch (error) {
								unexpectedError(error);
							}
						},
					}
				: {
						...common,
						component: RunFlow,
						props: {
							flow,
							location,
						},
					};
		}
	},
});
