<script setup lang="ts">
import type { PrimaryKey } from '@directus/types';
import type { Trigger } from '../types/trigger';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFlowTriggers } from '../composables/use-flow-triggers';

type TriggerList = TriggerListItem[];

interface TriggerListItem {
	trigger: Trigger;
}

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

const { t } = useI18n();

const {
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
} = useFlowTriggers({
	collection: (_) => props.collection,
	keys: (_) => props.primaryKey ? [props.primaryKey] : undefined,
});

const displayInterface = computed(
	() => props.triggers && props.triggers.some(({ trigger }) => !getButtonDisabled(trigger)),
);

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
