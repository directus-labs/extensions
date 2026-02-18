import type { PrimaryKey } from '@directus/types';
import type { Trigger } from '../types/trigger.js';
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash-es';

interface FlowTriggerContext {
	collection: (trigger: Trigger) => string | undefined;
	keys: (trigger: Trigger) => PrimaryKey[] | undefined;
	autoRefresh?: () => boolean;
	formValues?: () => Record<string, any>;
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

	const showUnsavedWarning = ref(false);

	const checkingUnsavedChanges = ref<string[]>([]);

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

			// Refresh the current page to show updated data (if enabled)
			const shouldAutoRefresh = context.autoRefresh?.() ?? true;
			if (shouldAutoRefresh) {
				// Use a small delay to ensure the notification is visible before refresh
				setTimeout(() => {
					window.location.reload();
				}, 500);
			}

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

	async function hasUnsavedChanges(trigger: Trigger): Promise<boolean> {
		try {
			const collection = context.collection(trigger);
			const keys = context.keys(trigger);

			// Can't detect unsaved changes if no collection, keys, or form values
			if (!collection || !keys || keys.length === 0 || keys[0] === '+') {
				return false;
			}

			// Can't detect if no form values are available
			if (!context.formValues) {
				return false;
			}

			// Fetch the saved item from API
			const response = await api.get(`/items/${collection}/${keys[0]}`);
			const savedValues = response.data.data;
			const currentValues = context.formValues();

			// Deep compare each field to detect differences
			for (const key in currentValues) {
				if (key in savedValues && !isEqual(currentValues[key], savedValues[key])) {
					return true; // Found a difference
				}
			}

			return false; // No differences found
		}
		catch (error) {
			// If we can't fetch the item or compare, assume no unsaved changes
			console.warn('Could not detect unsaved changes:', error);
			return false;
		}
	}

	async function onTriggerClick(trigger: Trigger) {
		selectedTrigger.value = trigger;

		// Check if we should warn about unsaved changes
		const shouldAutoRefresh = context.autoRefresh?.() ?? true;
		const keys = context.keys(trigger);
		const isItemDetailPage = keys && keys.length > 0 && keys[0] !== '+';

		if (shouldAutoRefresh && isItemDetailPage) {
			// Add to checking state
			const flowId = trigger.flowId;
			checkingUnsavedChanges.value = [...checkingUnsavedChanges.value, flowId];

			try {
				// Check for actual unsaved changes
				const hasChanges = await hasUnsavedChanges(trigger);

				if (hasChanges) {
					// Show unsaved changes warning
					showUnsavedWarning.value = true;
					return;
				}
			}
			finally {
				// Remove from checking state
				checkingUnsavedChanges.value = checkingUnsavedChanges.value.filter(
					(id) => id !== flowId,
				);
			}
		}

		// No unsaved changes or no auto-refresh, proceed directly
		confirmRunFlow();
	}

	function proceedAfterWarning() {
		showUnsavedWarning.value = false;
		confirmRunFlow();
	}

	function cancelWarning() {
		showUnsavedWarning.value = false;
		selectedTrigger.value = null;
	}

	return {
		getFlow,
		runFlow,
		runningFlows,
		checkingUnsavedChanges,
		onTriggerClick,
		getButtonText,
		getButtonIcon,
		confirmDetails,
		confirmValues,
		displayCustomConfirmDialog,
		isConfirmButtonDisabled,
		getConfirmButtonText,
		resetConfirm,
		showUnsavedWarning,
		proceedAfterWarning,
		cancelWarning,
	};
}
