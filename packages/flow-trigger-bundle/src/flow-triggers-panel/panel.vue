<script setup lang="ts">
import type { Trigger } from '../types/trigger';
import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFlowTriggers } from '../composables/use-flow-triggers';

type TriggerList = TriggerListItem[];

interface TriggerListItem {
	trigger: Trigger;
}

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		triggers?: TriggerList;
	}>(),
	{
		showHeader: false,
	},
);

const { t } = useI18n();

const { usePermissionsStore } = useStores();
const permissionsStore = usePermissionsStore();

const {
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
	collection: (trigger) => trigger.collection,
	keys: (trigger) => trigger.keys,
});

const triggers = computed(() => {
	return props.triggers?.filter(({ trigger }) => {
		return trigger.collection && permissionsStore.hasPermission(trigger.collection, 'read');
	});
});
</script>

<template>
	<div class="panel-flows" :class="{ 'has-header': props.showHeader }">
		<!-- eslint-disable-next-line vue/require-v-for-key -->
		<div v-for="{ trigger } in triggers" class="trigger">
			<v-button
				full-width
				:loading="runningFlows.includes(trigger.flowId)"
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
.panel-flows {
	padding: 12px;
}

.panel-flows.has-header {
	padding: 0 12px;
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
