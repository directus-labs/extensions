<script setup lang="ts">
import { ref, unref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { PrimaryKey } from '@directus/types';
import { Trigger } from '../lib/types';

type TriggerList = TriggerListItem[];

type TriggerListItem = {
	trigger: Trigger;
};

const props = withDefaults(
	defineProps<{
		triggers?: TriggerList;
		disabled?: boolean;
		collection: string;
		primaryKey?: PrimaryKey;
		field: string;
		width: string;
	}>(),
	{},
);

console.log(props);

const i18n = useI18n();
const { t } = i18n;

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
			field.meta?.required &&
			(!confirmValues.value ||
				confirmValues.value[field.field] === null ||
				confirmValues.value[field.field] === undefined)
		) {
			return true;
		}
	}

	return false;
});

const displayCustomConfirmDialog = computed(
	() => selectedTrigger.value && confirmDetails.value,
);

const displayInterface = computed(
	() => props.triggers && props.triggers.some(({ trigger }) => !getButtonDisabled(trigger)),
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

function getButtonDisabled(trigger: Trigger) {
	if (props.disabled) {
		return true;
	}

	const flow = getFlow(trigger.flowId);
	if (!flow) {
		return true;
	}

	const requireSelection = flow.options?.requireSelection !== false;
	if (requireSelection && props.primaryKey === '+') {
		return true;
	}

	return false;
}

function confirmRunFlow() {
	const flow = getFlow(selectedTrigger.value?.flowId);
	if (!flow) {
		return;
	}

	if (!Boolean(flow.options?.requireConfirmation)) {
		runFlow();
	} else {
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

	const collection = props.collection;
	const keys = props.primaryKey ? [props.primaryKey] : [];
	const values = unref(confirmValues) ?? {};
	const requireSelection = flow.options?.requireSelection === false;

	try {
		if (
			requireSelection &&
			keys?.length === 0
		) {
			await api.post(`/flows/trigger/${flowId}`, { ...values, collection });
		} else {
			await api.post(`/flows/trigger/${flowId}`, { ...values, collection, keys });
		}

		notificationStore.add({
			title: t('run_flow_success', { flow: flow.name }),
		});

		resetConfirm();
	} catch (error) {
		unexpectedError(error);
	} finally {
		selectedTrigger.value = null;
		runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
	}
}

function resetConfirm() {
	selectedTrigger.value = null;
	confirmValues.value = null;
}

function unexpectedError(error: unknown) {
	const code =
		(error as any)?.response?.data?.errors?.[0]?.extensions?.code ||
		(error as any)?.extensions?.code ||
		'UNKNOWN';
	
	console.warn(error);

	notificationStore.add({
		title: i18n['global'].t(`errors.${code}`),
		type: 'error',
		code,
		dialog: true,
		error,
	});
}

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

async function onTriggerClick(trigger: Trigger) {
	selectedTrigger.value = trigger;
	confirmRunFlow();
}
</script>

<template>
	<div v-if="displayInterface" class="interface-flows">
		<div v-for="{ trigger } in props.triggers" class="trigger">
			<v-button
				full-width
				:loading="runningFlows.includes(trigger.flowId)"
				:disabled="getButtonDisabled(trigger)"
				@click="onTriggerClick(trigger)"
			>
				<v-icon :name="getButtonIcon(trigger)" small left />
				{{ getButtonText(trigger) }}
			</v-button>
		</div>
		<v-dialog :model-value="displayCustomConfirmDialog" @esc="resetConfirm">
			<v-card class="allow-drawer">
				<v-card-title>{{ confirmDetails!.description ?? t('run_flow_confirm') }}</v-card-title>
				<v-card-text class="confirm-form">
					<v-form
						v-if="confirmDetails!.fields && confirmDetails!.fields.length > 0"
						:fields="confirmDetails!.fields"
						:model-value="confirmValues"
						autofocus
						primary-key="+"
						@update:model-value="confirmValues = $event"
					/>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="resetConfirm">
						{{ t('cancel') }}
					</v-button>
					<v-button :disabled="isConfirmButtonDisabled" @click="runFlow()">
						{{ getConfirmButtonText() }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped>
.interface-flows {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.trigger {
	margin-bottom: 12px;
}

.flow-field {
	display: flex;
	align-items: center;
	margin-top: 0.5em;
	background-color: var(--background-subdued);
	padding: 0.5em 0.75em;
	border-radius: var(--border-radius);
	border: var(--border-width) solid var(--border-subdued);
}

.flow-icon {
	overflow: hidden;
	background-color: var(--background-normal-alt);
	border: var(--border-width) solid var(--border-subdued);
	border-radius: 50%;
	padding: 0.5em;
	line-height: 1;
	flex-shrink: 0;
}

.flow-detail {
	flex-grow: 1;
	padding: 0 1em;
}

.flow-detail * {
	display: block;
	line-height: 1.2;
}

.flow-title {
	font-weight: bold;
}

.flow-desc {
	font-size: 0.8em;
}

.v-info {
	margin-top: 2em;
}
</style>
