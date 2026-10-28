import type { Flow, PrimaryKey } from '@directus/types';
import type { CommandActionContext, CommandConfig } from '../../command-palette';
import { h, ref } from 'vue';
import { defineCommands } from '../../command-palette';
import { useUnexpectedError } from '../../composables/use-unexpected-error';
import { getFlowsPath } from '../../utils/get-flows-path';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { getRouteVersionContext } from '../../utils/get-route-version-context';
import { isAdminFromStores } from '../../utils/is-admin';
import { canRunManualFlowFromCommandPalette, triggerManualFlow } from './manual-flow';
import RunFlow from './run-flow.vue';

export const flowCommands = defineCommands({
	groups: [{ id: 'flows', name: 'Flows', icon: 'bolt' }],
	commands: ({ stores }) => {
		if (!isAdminFromStores(stores)) return [];

		return [
			{
				id: 'create-flow',
				name: 'Create Flow',
				icon: 'add',
				group: 'flows',
				keywords: ['context'],
				action: ({ router }: CommandActionContext) => {
					router.push(getFlowsPath(router));
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
		// Studio hides flows while creating an item; there's nothing to run them on yet.
		if (route.params.primaryKey === '+') return [];
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
				name: `Run ${flow.name}`,
				render: () => h('span', ['Run ', h('em', `${flow.name}`)]),
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
					}
					catch (error) {
						unexpectedError(error);
						return false;
					}

					notificationsStore.add({ title: i18n.t('trigger_flow_success', { flow: flow.name }) });
					// The flow already ran, so a failed refresh must not keep the palette open for a retry, or show an error after the success toast.
					void Promise.resolve(notificationsStore.refreshUnreadCount?.()).catch((error) => console.warn(error));
					return true;
				},
			};
		}
	},
});
