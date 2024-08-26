<script setup lang="ts">
import { ref, unref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';

const props = withDefaults(
	defineProps<{
		value: string;
		disabled?: boolean;
		collection: string;
		field: string;
		text?: string;
		icon?: string;
	}>(),
	{},
);

console.log(props);

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

const runningFlows = ref<string[]>([]);

const confirmValues = ref<Record<string, any> | null>();
const confirmDetails = ref<{
	description: string;
	fields: Record<string, any>[];
} | null>(null);

const isConfirmButtonDisabled = computed(() => {
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
	() => {
		return Boolean(confirmDetails.value !== null);
	},
);

function getConfirmButtonText() {
	return t('run_flow');
}

function getButtonText() {
	if (props.text) {
		return props.text;
	}

	const flow = getFlow(props.value);
	if (flow) {
		return flow.name;
	}

	return t('run_flow');
}

function getButtonIcon() {
	if (props.icon) {
		return props.icon;
	}

	const flow = getFlow(props.value);
	if (flow) {
		return flow.icon;
	}

	return 'bolt';
}

function confirmRunFlow() {
	const flow = getFlow(props.value);
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
	const flow = getFlow(props.value);
	if (!flow) {
		return;
	}

	const flowId = flow.id;

	runningFlows.value = [...runningFlows.value, flowId];

	const collection = props.collection;
	const keys = [];
	const values = unref(confirmValues) ?? {};

	try {
		if (
			flow.options?.requireSelection === false &&
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
		runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
	}
}

function resetConfirm() {
	confirmDetails.value = null;
	confirmValues.value = null;
}

function unexpectedError(error: unknown) {
	const code =
		(error as any)?.response?.data?.errors?.[0]?.extensions?.code ||
		(error as any)?.extensions?.code ||
		'UNKNOWN';
	
	console.warn(error);

	notificationStore.add({
		title: t(`errors.${code}`),
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

function onButtonClick(e: any) {
	console.log(e);
	e.preventDefault();
	e.stopPropagation();
	confirmRunFlow();
}
</script>

<template>
	<div class="display-flow">
		<v-button
			small
			:loading="runningFlows.includes(props.value)"
			:disabled="props.disabled"
			@click="onButtonClick($event)"
		>
			<v-icon :name="getButtonIcon()" small left />
			{{ getButtonText() }}
		</v-button>
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
.display-flow {
	display: flex;
	align-items: center;
}
</style>
