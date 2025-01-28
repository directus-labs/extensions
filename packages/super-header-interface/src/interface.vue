<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStores } from '@directus/extensions-sdk';
import { render } from 'micromustache';

import VText from './components/Text.vue';
import LinkAction from './components/LinkAction.vue';
import FlowAction from './components/FlowAction.vue';
import { useFlows } from './composables/useFlows';
import type { SuperHeaderProps, Action, FlowIdentifier } from './types';

const props = withDefaults(defineProps<SuperHeaderProps>(), {
	actions: () => [],
	help: '',
});

const { t } = useI18n();
const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();

const { fetchFlows, showForm, submitFlow, currentFlow, runFlow } = useFlows(props.collection);

const expanded = ref(false);
const flowFormData = ref<Record<string, any>>({});

const values = inject('values', ref<Record<string, any>>({}));

const toggleHelp = () => {
	expanded.value = !expanded.value;
};

const handleFlowExecuted = async ({ success, flow, result, error }) => {
	if (success) {
		console.log(`Flow ${flow.key} executed successfully`, result);
	} else {
		console.error(`Flow ${flow.key} execution failed:`, error);
	}
};

const actionList = computed(() => {
	if (!props.actions || !props.actions?.length) return [];
	const formattedActions = props.actions.map((action) => {
		if (action.actionType === 'link') {
			return {
				...action,
				// Render the URL with item values in case it contains variables
				url: render(action.url ?? '', values.value),
			};
		}
		return action;
	});

	return formattedActions;
});

const handleActionClick = async (action: Action) => {
	if (action.actionType === 'flow' && action.flow) {
		runFlow(action.flow, props.values);
	}
};

const flowIdentifiers = () => {
	if (!actionList.value || !actionList.value?.length) return [];

	return actionList.value
		.filter((action) => action.actionType === 'flow' && action.flow)
		.map((action) => action.flow as FlowIdentifier);
};

if (flowIdentifiers().length) {
	fetchFlows(flowIdentifiers());
}

const hasMultipleActions = computed(() => {
	if (!actionList.value || !actionList.value?.length) return false;
	return actionList.value?.length > 1;
});

const primaryAction = computed(() => {
	if (!actionList.value || !actionList.value?.length) return null;
	return actionList.value[0] || null;
});

const fields = computed(() => {
	return fieldsStore.getFieldsForCollection(props.collection);
});
</script>

<template>
	<div class="page-header">
		<div class="header-content" :style="{ '--header-color': color }">
			<div class="text-content">
				<v-icon v-if="icon" :name="icon" />
				<div>
					<p class="title">
						<render-template :collection="collection" :fields="fields" :item="values" :template="title" />
					</p>
					<p v-if="subtitle" class="subtitle">
						<render-template :collection="collection" :fields="fields" :item="values" :template="subtitle" />
					</p>
				</div>
			</div>
			<div class="actions">
				<v-button v-if="help" secondary small @click="toggleHelp">
					<v-icon name="help_outline" left />
					{{ t('help') }}
					<v-icon :name="expanded ? 'expand_less' : 'expand_more'" right />
				</v-button>
				<template v-if="!hasMultipleActions && primaryAction">
					<LinkAction
						v-if="primaryAction.actionType === 'link'"
						:label="primaryAction.label"
						:url="primaryAction.url || ''"
						:icon="primaryAction.icon"
						:type="primaryAction.type"
					/>
					<FlowAction
						v-else-if="primaryAction.actionType === 'flow' && primaryAction.flow"
						:label="primaryAction.label"
							:collection="collection"
						:flow="primaryAction.flow"
						:icon="primaryAction.icon"
						:type="primaryAction.type"
						:values="values"
						@flow-executed="handleFlowExecuted"
					/>
				</template>

				<v-menu v-else-if="hasMultipleActions" placement="bottom-end">
					<template #activator="{ toggle }">
						<v-button small @click="toggle">
							{{ t('actions') }}
							<v-icon name="expand_more" right />
						</v-button>
					</template>

					<v-list>
						<v-list-item
							v-for="(action, index) in actionList"
							:key="index"
							clickable
							@click="action.actionType === 'link' ? null : handleActionClick(action)"
						>
							<v-list-item-icon v-if="action.icon"><v-icon :name="action.icon" /></v-list-item-icon>
							<v-list-item-content>
								<v-list-item-title>
									<template v-if="action.actionType === 'link'">
										<a :href="action.url" target="_blank">{{ t(action.label) }}</a>
									</template>
									<template v-else>
										{{ t(action.label) }}
									</template>
								</v-list-item-title>
							</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
		</div>
		<transition-expand>
			<div v-if="expanded && help" class="help-text">
				<v-text :content="help" />
			</div>
		</transition-expand>
	</div>

	<!-- Flow Form Modal -->
	<v-dialog v-model="showForm">
		<v-card>
			<v-card-title>{{ currentFlow?.name || 'Run Flow' }}</v-card-title>
			<v-card-text>
				<v-form v-if="currentFlow?.options?.fields" v-model="flowFormData" :fields="currentFlow.options.fields" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="showForm = false">
					{{ t('cancel') }}
				</v-button>
				<v-button
					@click="
						submitFlow({
							collection: currentFlow.collection,
							key: currentFlow.key,
							...flowFormData,
						})
					"
				>
					{{ t('run_flow') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped lang="scss">
.actions {
	display: flex;
	gap: 8px;
	align-items: center;
}

.header-content {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 8px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
}

.icon {
	--v-icon-color: var(--header-color);
}

.text-content {
	display: flex;
	.v-icon {
		margin-right: 4px;
		transform: translateY(-1px);
	}
}

.title {
	font-size: 20px;
	font-weight: 600;
}

.subtitle {
	font-size: 14px;
	color: var(--theme--foreground-subdued);
	margin-top: 4px;
}

.actions {
	display: flex;
	gap: 8px;
}

.help-text {
	padding-block: 16px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
}
</style>
