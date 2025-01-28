import { ref, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import type { FlowIdentifier } from '../types';

const showForm = ref(false);
const currentFlow = ref<any>(null);

export function useFlows(collection: string) {
	const { t } = useI18n();
	const api = useApi();
	const formValues = inject('values') as Record<string, any>;
	const route = useRoute();

	const { useNotificationsStore } = useStores();
	const notificationStore = useNotificationsStore();

	const flowsCache = ref<Record<string, any>>({});
	const loading = ref(false);

	const fetchFlows = async (flowIdentifiers: FlowIdentifier[]) => {
		const uniqueFlowIds = flowIdentifiers.filter(({ key }) => !flowsCache.value[key]);
		if (uniqueFlowIds.length === 0) return;

		loading.value = true;

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
		} catch (error) {
			console.error('Error fetching flows:', error);
		} finally {
			loading.value = false;
		}
	};

	const getFlow = async (flowIdentifier: FlowIdentifier) => {
		const cacheKey = flowIdentifier.key;

		if (!flowsCache.value[cacheKey]) {
			await fetchFlows([flowIdentifier]);
		}

		return flowsCache.value[cacheKey];
	};

	const runFlow = async (flowIdentifier: FlowIdentifier, values: Record<string, any>) => {
		try {
			const flow = await getFlow(flowIdentifier);
			let formData = values as any;

			if (flow.options?.requireConfirmation) {
				formData = await showFlowForm(flow);
			}

			const response = await api.post(`/flows/trigger/${flow.id}`, {
				...formData,
				collection: collection,
				keys: [route.params.primaryKey] ?? [],
				$values: formValues.value,
				$route: {
					params: route.params,
					query: route.query,
					fullPath: route.fullPath,
				},
			});

			notificationStore.add({
				title: t('run_flow_success', { flow: flow.name }),
			});

			return response.data;
		} catch (error) {
			console.error(`Error running flow ${flowIdentifier.key}:`, error);
			throw error;
		}
	};

	const showFlowForm = async (flow: any) => {
		currentFlow.value = flow;
		showForm.value = true;

		return new Promise((resolve, reject) => {
			const onSubmit = (values: Record<string, any>) => {
				showForm.value = false;
				resolve(values);
			};

			const onCancel = () => {
				showForm.value = false;
				reject('Flow cancelled');
			};

			currentFlow.value = { ...flow, onSubmit, onCancel };
		});
		return {};
	};

	const submitFlow = async (values: Record<string, any>) => {
		if (!currentFlow.value) return;
		currentFlow.value.onSubmit(values);
	};

	return {
		flowsCache,
		loading,
		fetchFlows,
		getFlow,
		runFlow,
		showForm,
		currentFlow,
		showFlowForm,
		submitFlow,
	};
}
