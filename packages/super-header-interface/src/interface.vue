<script setup lang="ts">
import type { Action, FlowIdentifier, SuperHeaderProps } from './types';
import { useApi, useStores } from '@directus/extensions-sdk';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { render } from 'micromustache';

import { computed, inject, ref, toRefs, watch } from 'vue';

import { useI18n } from 'vue-i18n';
import FlowAction from './components/FlowAction.vue';
import LinkAction from './components/LinkAction.vue';
import VText from './components/Text.vue';
import { useFlows } from './composables/useFlows';

const props = withDefaults(defineProps<SuperHeaderProps>(), {
	actions: () => [],
	help: '',
});

const { t } = useI18n();
const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();

const { fetchFlows, showForm, submitFlow, currentFlow, runFlow } = useFlows(props.collection, props.primaryKey);

const expanded = ref(false);
const flowFormData = ref<Record<string, any>>({});

const api = useApi();
const values = inject('values', ref<Record<string, any>>({}));
const fetchedTemplateData = ref<Record<string, any>>({});
const isLoading = ref(false);
const { primaryKey } = toRefs(props);

function toggleHelp() {
	expanded.value = !expanded.value;
}

const combinedItemData = computed(() => {
	// Create a new object that prioritizes API structure for nested objects
	// while still allowing direct values from `values` to override simple fields
	const result = { ...values.value };

	// For each key in the API response
	Object.entries(fetchedTemplateData.value).forEach(([key, value]) => {
		// If the value is an object (not null) and we have a simple value in result,
		// prefer the complex object from the API
		if (value !== null
			&& typeof value === 'object'
			&& (!result[key] || typeof result[key] !== 'object' || result[key] === null)) {
			result[key] = value;
		}
	});

	return result;
});

const actionList = computed(() => {
	if (!props.actions || !props.actions?.length)
		return [];

	const formattedActions = props.actions.map((action) => {
		if (action.actionType === 'link') {
			return {
				...action,
				// Render the URL with combined item values
				url: render(action.url ?? '', combinedItemData.value),
			};
		}

		return action;
	});

	return formattedActions;
});

async function handleActionClick(action: Action) {
	if (action.actionType === 'flow' && action.flow) {
		runFlow(action.flow, props.values);
	}
}

function flowIdentifiers() {
	if (!actionList.value || !actionList.value?.length)
		return [];

	return actionList.value
		.filter((action) => action.actionType === 'flow' && action.flow)
		.map((action) => action.flow as FlowIdentifier);
}

if (flowIdentifiers().length > 0) {
	fetchFlows(flowIdentifiers());
}

const hasMultipleActions = computed(() => {
	if (!actionList.value || !actionList.value?.length)
		return false;
	return actionList.value?.length > 1;
});

const primaryAction = computed(() => {
	if (!actionList.value || !actionList.value?.length)
		return null;
	return actionList.value[0] || null;
});

const fields = computed(() => {
	return fieldsStore.getFieldsForCollection(props.collection);
});

/**
 * Get all required template fields from title, subtitle, and link actions.
 * This includes both regular and relational fields (e.g. "field" and "related.field").
 * @returns Array of field names needed for template rendering
 */
function getAllRequiredTemplateFields(): string[] {
	const fieldsFromTitle = props.title ? getFieldsFromTemplate(props.title) : [];
	const fieldsFromSubtitle = props.subtitle ? getFieldsFromTemplate(props.subtitle) : [];

	// Get fields from link action URLs
	const fieldsFromLinks = props.actions
		?.filter((action) => action.actionType === 'link' && action.url)
		.flatMap((action) => getFieldsFromTemplate(action.url || '')) || [];

	// Combine all fields and deduplicate
	const allFields = [...fieldsFromTitle, ...fieldsFromSubtitle, ...fieldsFromLinks];
	return [...new Set(allFields)];
}

watch(
	[primaryKey, () => getAllRequiredTemplateFields()],
	async ([value, fields]) => {
		if (!value || value === '+' || fields.length === 0) return;

		isLoading.value = true;

		try {
			const response = await api.get(`${getEndpoint(props.collection)}/${value}`, {
				params: {
					fields,
				},
			});

			fetchedTemplateData.value = response.data.data;
		}
		catch (error) {
			console.error('Failed to fetch template data:', error);
			fetchedTemplateData.value = {};
		}
		finally {
			isLoading.value = false;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="page-header">
		<div class="header-content" :style="{ '--header-color': color }">
			<div class="text-container">
				<v-icon v-if="icon" :name="icon" />
				<div class="text-content">
					<p v-if="title" class="text-title">
						<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="title" />
					</p>
					<p v-if="subtitle" class="text-subtitle">
						<render-template :collection="collection" :fields="fields" :item="combinedItemData" :template="subtitle" />
					</p>
				</div>
			</div>
			<div class="actions-wrapper">
				<div class="actions-container">
					<template v-if="help">
						<v-button secondary small class="full-button" @click="toggleHelp">
							<v-icon name="help_outline" left />
							{{ t('help') }}
							<v-icon :name="expanded ? 'expand_less' : 'expand_more'" right />
						</v-button>
						<!-- We show the icon only on smaller containers -->
						<v-button secondary small class="icon-button" icon @click="toggleHelp">
							<v-icon name="help_outline" />
						</v-button>
					</template>
					<template v-if="!hasMultipleActions && primaryAction">
						<LinkAction
							v-if="primaryAction.actionType === 'link'"
							:label="primaryAction.label"
							:url="primaryAction.url || ''"
							:icon="primaryAction.icon"
							:kind="primaryAction.type"
						/>
						<FlowAction
							v-else-if="primaryAction.actionType === 'flow' && primaryAction.flow"
							:label="primaryAction.label"
							:collection="collection"
							:flow="primaryAction.flow"
							:icon="primaryAction.icon"
							:kind="primaryAction.type"
							:values="combinedItemData"
						/>
					</template>

					<v-menu v-else-if="hasMultipleActions" placement="bottom-end">
						<template #activator="{ toggle }">
							<div>
								<v-button small class="full-button" @click="toggle">
									{{ t('actions') }}
									<v-icon name="expand_more" right />
								</v-button>
								<!-- We show the icon only on smaller containers -->
								<v-button v-tooltip="t('actions')" small class="icon-button" icon @click="toggle">
									<v-icon name="expand_more" />
								</v-button>
							</div>
						</template>

						<v-list>
							<v-list-item
								v-for="(action, index) in actionList"
								:key="index"
								clickable
								@click="action.actionType === 'link' ? null : handleActionClick(action)"
							>
								<v-list-item-icon v-if="action.icon">
									<v-icon :name="action.icon" />
								</v-list-item-icon>
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
		</div>
		<!-- Expanded Help -->
		<transition-expand>
			<div v-if="expanded && help" class="help-text">
				<VText :content="help" />
				<div class="collapse-button-container">
					<v-button class="collapse-button" small secondary @click="toggleHelp">
						{{ `${t('collapse')} ${t('help')}` }}
						<v-icon name="expand_less" right />
					</v-button>
				</div>
			</div>
		</transition-expand>

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
	</div>
</template>

<style scoped lang="scss">
.page-header {
	position: relative;
	display: block;
	width: 100%;
}

.header-content {
	container-type: inline-size;
	width: 100%;
	display: flex;
	gap: calc(var(--theme--form--column-gap) / 2);
	padding-bottom: 8px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
	align-items: flex-start;
	justify-content: space-between;
	min-width: 0;
}

.text-container {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;

	.v-icon {
		--v-icon-color: var(--header-color);
		flex-shrink: 0;
	}

	.text-content {
		min-width: 0;
		flex: 1;

		.text-title {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			font-size: 20px;
			font-weight: 600;
		}

		.text-subtitle {
			margin-top: 4px;
			font-size: 14px;
			color: color-mix(in srgb, var(--theme--foreground), var(--theme--background) 25%);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}

.actions-wrapper {
	flex-shrink: 0;
}

.actions-container {
	display: flex;
	gap: 12px;
	align-items: center;

	.v-button {
		width: 100%;
		justify-content: center;
		position: relative;
	}

	.full-button {
		display: block;
		position: relative;
	}

	.icon-button {
		display: none;
		position: relative;
	}

	@container (max-width: 600px) {
		align-items: stretch;
		width: 100%;

		.full-button {
			display: none;
			position: relative;
		}

		.icon-button {
			display: block;
			position: relative;
		}
	}
}

.help-text {
	padding-block: 16px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
}

.collapse-button-container {
	display: flex;
	justify-content: flex-end;
}
</style>
