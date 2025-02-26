import type { PrimaryKey } from '@directus/types';
import type { Trigger } from '../types/trigger.js';
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';

interface FlowTriggerContext {
	collection: (trigger: Trigger) => string | undefined;
	keys: (trigger: Trigger) => PrimaryKey[] | undefined;
}

export function useFlowTriggers(context: FlowTriggerContext) {
	const { t } = useI18n();

	const api = useApi();

	const { useFlowsStore, useNotificationsStore } = useStores();
	const flowsStore = useFlowsStore();
	const notificationStore = useNotificationsStore();

	const flowMap = computed(() => {
		const map = new Map<string, any>();

		for (const flow of flowsStore.flows) {
			map.set(flow.id, flow);
		}

		return map;
	});

	function getFlow(flowId?: string | null) {
		if (!flowId) {
			return null;
		}

		const flow = unref(flowMap).get(flowId);

		if (!flow) {
			return null;
		}

		return flow;
	}

	const runningFlows = ref<string[]>([]);

	const selectedTrigger = ref<Trigger | null>(null);

	const confirmValues = ref<Record<string, any> | null>();

	const confirmDetails = ref<{
		description: string;
		fields: Record<string, any>[];
	} | null>(null);

	const isConfirmButtonDisabled = computed(() => {
		if (!selectedTrigger.value) {
			return true;
		}

		for (const field of confirmDetails.value?.fields || []) {
			if (
				field.meta?.required
				&& (!confirmValues.value
					|| confirmValues.value[field.field] === null
					|| confirmValues.value[field.field] === undefined)
			) {
				return true;
			}
		}

		return false;
	});

	const displayCustomConfirmDialog = computed(
		() => selectedTrigger.value && confirmDetails.value,
	);

	function getConfirmButtonText() {
		return t('run_flow');
	}

	function getButtonText(trigger: Trigger) {
		if (trigger.text) {
			return trigger.text;
		}

		const flow = getFlow(trigger.flowId);

		if (flow) {
			return flow.name;
		}

		return t('run_flow');
	}

	function getButtonIcon(trigger: Trigger) {
		if (trigger.icon) {
			return trigger.icon;
		}

		const flow = getFlow(trigger.flowId);

		if (flow) {
			return flow.icon;
		}

		return 'bolt';
	}

	function confirmRunFlow() {
		const flow = getFlow(selectedTrigger.value?.flowId);

		if (!flow) {
			return;
		}

		if (!flow.options?.requireConfirmation) {
			runFlow();
		}
		else {
			confirmDetails.value = {
				description: flow.options.confirmationDescription,
				fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
					...field,
					name: !field.name && field.field ? formatTitle(field.field) : field.name,
				})),
			};
		}
	}

	async function runFlow() {
		const trigger = unref(selectedTrigger);

		if (!trigger) {
			return;
		}

		const flow = getFlow(trigger.flowId);

		if (!flow) {
			return;
		}

		const flowId = flow.id;

		runningFlows.value = [...runningFlows.value, flowId];

		const collection = context.collection(trigger);
		const keys = context.keys(trigger);
		const values = unref(confirmValues) ?? {};

		try {
			await (flow.options?.requireSelection === false
				&& keys?.length === 0
				? api.post(`/flows/trigger/${flowId}`, { ...values, collection })
				: api.post(`/flows/trigger/${flowId}`, { ...values, collection, keys }));

			notificationStore.add({
				title: t('run_flow_success', { flow: flow.name }),
			});

			resetConfirm();
		}
		catch (error) {
			unexpectedError(error);
		}
		finally {
			selectedTrigger.value = null;
			runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
		}
	}

	function resetConfirm() {
		selectedTrigger.value = null;
		confirmDetails.value = null;
		confirmValues.value = null;
	}

	function unexpectedError(error: unknown) {
		const code =
			(error as any)?.response?.data?.errors?.[0]?.extensions?.code
			|| (error as any)?.extensions?.code
			|| 'UNKNOWN';

		console.warn(error);

		notificationStore.add({
			title: t(`errors.${code}`),
			type: 'error',
			code,
			dialog: true,
			error,
		});
	}

	async function onTriggerClick(trigger: Trigger) {
		selectedTrigger.value = trigger;
		confirmRunFlow();
	}

	return {
		getFlow,
		runFlow,
		runningFlows,
		onTriggerClick,
		getButtonText,
		getButtonIcon,
		confirmDetails,
		confirmValues,
		displayCustomConfirmDialog,
		isConfirmButtonDisabled,
		getConfirmButtonText,
		resetConfirm,
	};
}
