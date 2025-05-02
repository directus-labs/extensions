import type { FlowIdentifier } from '../types';
import { useApi, useStores } from '@directus/extensions-sdk';
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFlows(collection: string, primaryKey: string | number | null) {
	const { t } = useI18n();
	const api = useApi();
	const formValues = inject('values') as Record<string, any>;
	const { useNotificationsStore } = useStores();
	const notificationStore = useNotificationsStore();

	// Replace loading with runningFlows
	const runningFlows = ref<string[]>([]);
	const flowsCache = ref<Record<string, any>>({});

	// Confirmation state
	const confirmRunFlow = ref<string | null>(null);
	const confirmValues = ref<Record<string, any> | null>(null);
	const confirmedUnsavedChanges = ref(false);

	// Store item values for each flow that needs confirmation
	const flowItemValues = ref<Record<string, Record<string, any>>>({});

	const fetchFlows = async (flowIdentifiers: FlowIdentifier[]) => {
		const uniqueFlowIds = flowIdentifiers.filter(({ key }) => !flowsCache.value[key]);
		if (uniqueFlowIds.length === 0)
			return;

		try {
			const response = await api.get('/flows', {
				params: {
					filter: {
						id: {
							_in: uniqueFlowIds.map((flow) => flow.key),
						},
					},
				},
			});

			response.data.data.forEach((flow: any) => {
				flowsCache.value[`${flow.id}`] = flow;
			});
		}
		catch (error) {
			console.error('Error fetching flows:', error);
		}
	};

	const getFlow = async (flowIdentifier: FlowIdentifier) => {
		const cacheKey = flowIdentifier.key;

		if (!flowsCache.value[cacheKey]) {
			await fetchFlows([flowIdentifier]);
		}

		return flowsCache.value[cacheKey];
	};

	// Reset confirmation state
	const resetConfirm = (onReset?: () => void) => {
		confirmRunFlow.value = null;
		confirmValues.value = null;
		confirmedUnsavedChanges.value = false;

		// Call the onReset callback if provided
		if (onReset) {
			onReset();
		}
	};

	// Main execution function
	const _executeFlow = async (flowId: string, itemValues: Record<string, any>, flowFormData = {}) => {
		runningFlows.value = [...runningFlows.value, flowId];

		try {
			let keys: (string | number)[] = [];

			if (itemValues && itemValues.id && itemValues.id !== '+') {
				keys = [itemValues.id];
			}

			else if (primaryKey && primaryKey !== '+') {
				keys = [primaryKey];
			}

			const payload = {
				...flowFormData,
				collection,
				keys,
				$values: formValues.value,
			};

			const flow = flowsCache.value[flowId];
			const response = await api.post(`/flows/trigger/${flowId}`, payload);

			if (flow?.options?.async) {
				notificationStore.add({
					title: t('trigger_flow_success', { flow: flow.name }),
				});
			}
			else {
				notificationStore.add({
					title: t('run_flow_success', { flow: flow.name }),
				});
			}

			resetConfirm();

			return response.data;
		}
		catch (error) {
			console.error(`Error running flow ${flowId}:`, error);

			notificationStore.add({
				title: t('unexpected_error'),
				type: 'error',
				code: 'UNKNOWN',
				dialog: true,
				error,
			});
		}
		finally {
			runningFlows.value = runningFlows.value.filter((id) => id !== flowId);
		}
	};

	// Flow with confirmation handling
	const runFlow = async (flowIdentifier: FlowIdentifier, itemValues: Record<string, any>, hasEdits = false) => {
		const flow = await getFlow(flowIdentifier);

		if (!flow) return;

		const flowId = flowIdentifier.key;

		flowItemValues.value[flowId] = { ...itemValues };

		if (hasEdits && !confirmedUnsavedChanges.value) {
			confirmRunFlow.value = flowId;
			return;
		}

		if (flow.options?.requireConfirmation) {
			confirmRunFlow.value = flowId;
			return;
		}

		return _executeFlow(flowId, itemValues);
	};

	// Confirm unsaved changes
	const _confirmUnsavedChanges = async (flowId: string) => {
		confirmedUnsavedChanges.value = true;

		const flow = flowsCache.value[flowId];

		if (!flow?.options?.requireConfirmation) {
			_executeFlow(flowId, {});
		}
	};

	// Execute flow after custom confirmation
	const executeConfirmedFlow = (flowId: string, formData: Record<string, any>, onReset?: () => void) => {
		if (!flowId) return;

		// Get the stored item values for this flow
		const itemValues = flowItemValues.value[flowId] || {};

		// Reset the form before executing (ensures form is cleared even if API call fails)
		if (onReset) {
			onReset();
		}

		// Execute the flow with the form data
		_executeFlow(flowId, itemValues, formData);
	};

	return {
		flowsCache,
		runningFlows,
		confirmRunFlow,
		fetchFlows,
		getFlow,
		runFlow,
		resetConfirm,
		executeConfirmedFlow,
	};
}
