<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
// @ts-expect-error - types missing
import { formatTitle } from '@directus/format-title';

import { computed, ref, toRefs } from 'vue';
import { useSeoI18n } from '../lang/use-seo-i18n';
import OgImagePreview from '../shared/components/OgImagePreview.vue';
import SearchPreview from '../shared/components/SearchPreview.vue';
import { isEmptyValue, nextRovingValue } from '../shared/utils';

import Analysis from './analysis/components/Analysis.vue';
import FocusKeyphrase from './components/FocusKeyphrase.vue';

import MetaDescriptionField from './components/MetaDescriptionField.vue';
import OgImage from './components/OgImage.vue';
import TitleField from './components/TitleField.vue';
import { searchControls, sitemapFields } from './fields';

interface Props extends SeoInterfaceOptions {
	collection: string;
	field: string;
	value: SeoValue | null;
	disabled?: boolean;
	values: Record<string, unknown>;
}

const props = defineProps<Props>();

const emit = defineEmits<(event: 'input', value: SeoValue) => void>();

const { t } = useSeoI18n();

const { value } = toRefs(props);

function getDefaultSeoValue(): SeoValue {
	return {
		title: '',
		meta_description: '',
		focus_keyphrase: '',
		og_image: '',
		sitemap: {
			priority: '0.5',
			change_frequency: 'weekly',
		},
		no_index: false,
		no_follow: false,
		additional_fields: {},
	};
}

const internalValue = computed<SeoValue>(() => {
	if (!value.value) {
		return {
			...getDefaultSeoValue(),
			sitemap: {
				priority: props.defaultPriority || '0.5',
				change_frequency: props.defaultChangeFrequency || 'weekly',
			},
		};
	}

	return {
		...value.value,
		sitemap: {
			priority: props.defaultPriority || '0.5',
			change_frequency: props.defaultChangeFrequency || 'weekly',
			...value.value.sitemap,
		},
	};
});

function updateField(field: string, value: unknown) {
	const [key, subKey] = field.split('.') as [keyof SeoValue, string?];
	const updatedValue: Record<string, unknown> = { ...internalValue.value };
	updatedValue[key] = subKey ? { ...(updatedValue[key] as object), [subKey]: value } : value;
	emit('input', updatedValue as SeoValue);
}

/* Transform additional fields to the format v-form expects */
const additionalFields = computed(() => {
	return (
		props.additionalFields
			?.map((field) => {
				if (!field || !field.field) {
					console.warn('Invalid field definition:', field);
					return null;
				}

				const { field: fieldName, type, ...rest } = field;
				return {
					field: fieldName,
					name: formatTitle(field.name || fieldName),
					type,
					meta: {
						...rest,
					},
				};
			})
			.filter(Boolean) ?? []
	);
});

// v-form marks a field as edited when it differs from its initial value
const initialAdditionalFields = { ...props.value?.additional_fields };

const showAdvancedTab = computed(() => props.showSitemap || props.showSearchControls);
const showCustomFieldsTab = computed(() => additionalFields.value?.length > 0);
const showAnalysisTab = computed(() => !!props.showFocusKeyphrase);

const missingRequiredCount = computed(() => {
	const values = internalValue.value.additional_fields ?? {};
	return (props.additionalFields ?? []).filter((field) => field?.required && isEmptyValue(values[String(field.field)])).length;
});

const tabs = computed(() => [
	{ value: 'metadata', label: t('seo_plugin.ui.tabs.basic'), show: true },
	{ value: 'advanced-settings', label: t('seo_plugin.ui.tabs.advanced'), show: showAdvancedTab.value },
	{ value: 'custom-fields', label: t('seo_plugin.ui.tabs.custom_fields'), show: showCustomFieldsTab.value, missingRequired: missingRequiredCount.value },
	{ value: 'analysis', label: t('seo_plugin.ui.tabs.analysis'), show: showAnalysisTab.value },
].filter((tab) => tab.show));

const activeTab = ref('metadata');
// Fall back to Basic if the active tab disappears (e.g. its option is turned off)
const currentTab = computed(() => (tabs.value.some((tab) => tab.value === activeTab.value) ? activeTab.value : 'metadata'));

const idPrefix = `seo-${Math.random().toString(36).slice(2, 8)}`;

function onTabKeydown(event: KeyboardEvent) {
	const next = nextRovingValue(event.key, tabs.value.map((tab) => tab.value), currentTab.value);
	if (!next) return;

	event.preventDefault();
	activeTab.value = next;
	(event.currentTarget as HTMLElement).querySelector<HTMLElement>(`#${idPrefix}-tab-${next}`)?.focus();
}
</script>

<template>
	<div class="seo-tabs">
		<div v-if="tabs.length > 1" class="tabs-list" role="tablist" :aria-label="t('seo_plugin.ui.tabs.label')" @keydown="onTabKeydown">
			<button
				v-for="tab in tabs"
				:id="`${idPrefix}-tab-${tab.value}`"
				:key="tab.value"
				type="button"
				role="tab"
				class="tab-trigger"
				:tabindex="currentTab === tab.value ? 0 : -1"
				:aria-selected="currentTab === tab.value"
				:aria-controls="`${idPrefix}-panel`"
				:data-state="currentTab === tab.value ? 'active' : 'inactive'"
				@click="activeTab = tab.value"
			>
				<span>{{ tab.label }}</span>
				<v-icon
					v-if="tab.missingRequired"
					v-tooltip="t('seo_plugin.ui.required_count', { count: tab.missingRequired })"
					class="warning"
					name="error"
					small
				/>
			</button>
		</div>

		<!-- v-if, not v-show: interfaces like the code editor measure their size on mount (#292) -->
		<div v-if="currentTab === 'metadata'" :id="`${idPrefix}-panel`" role="tabpanel" :aria-labelledby="`${idPrefix}-tab-metadata`" class="tab-content form-grid">
			<!-- Title -->
			<TitleField
				:model-value="internalValue.title"
				:template="props.titleTemplate"
				:disabled="props.disabled"
				@update:model-value="updateField('title', $event)"
			/>

			<!-- Meta Description -->
			<MetaDescriptionField
				:model-value="internalValue.meta_description"
				:template="props.descriptionTemplate"
				:disabled="props.disabled"
				@update:model-value="updateField('meta_description', $event)"
			/>

			<!-- Search Preview -->
			<SearchPreview
				:title="internalValue.title"
				:meta-description="internalValue.meta_description"
				:collection="props.collection || ''"
			/>

			<v-divider class="field" />

			<!-- OG Image -->
			<OgImagePreview
				v-if="props.showOgImage"
				:title="internalValue.title"
				:description="internalValue.meta_description"
				:og-image="internalValue.og_image"
				class="field"
			>
				<OgImage
					v-if="props.showOgImage"
					:value="internalValue.og_image"
					:disabled="props.disabled"
					in-og-preview
					crop
					@input="updateField('og_image', $event)"
				/>
			</OgImagePreview>
		</div>

		<div v-else-if="currentTab === 'advanced-settings'" :id="`${idPrefix}-panel`" role="tabpanel" :aria-labelledby="`${idPrefix}-tab-advanced-settings`" class="tab-content form-grid">
			<!-- Sitemap Fields -->
			<div v-if="props.showSitemap" class="field">
				<label class="label field-label type-label">
					{{ t('seo_plugin.interface.sitemap_settings') }}
					<v-icon v-tooltip="t('seo_plugin.tooltips.sitemap_settings')" name="info" small class="info-icon" />
				</label>
				<div class="form-grid">
					<div v-for="sitemapField in sitemapFields" :key="sitemapField.key" class="field half">
						<v-select
							:model-value="internalValue.sitemap?.[sitemapField.key as keyof SeoValue['sitemap']] || ''"
							:items="sitemapField.options.map((option) => ({ ...option, text: t(option.text) }))"
							:disabled="props.disabled"
							:placeholder="t(sitemapField.label)"
							@update:model-value="updateField(`sitemap.${sitemapField.key}` as 'sitemap.priority' | 'sitemap.change_frequency', $event)"
						>
							<template #prepend>
								<v-icon :name="sitemapField.icon" />
							</template>
						</v-select>
						<small v-if="sitemapField.tooltip" class="hint">{{ t(sitemapField.tooltip) }}</small>
					</div>
				</div>
			</div>

			<!-- Search Engine Controls -->
			<div v-if="props.showSearchControls" class="field">
				<label class="label field-label type-label">
					{{ t('seo_plugin.interface.search_controls') }}
					<v-icon v-tooltip="t('seo_plugin.tooltips.search_controls')" name="info" small class="info-icon" />
				</label>
				<div class="form-grid">
					<interface-boolean
						v-for="control in searchControls"
						:key="control.key"
						class="field half"
						:value="internalValue[control.key as 'no_index' | 'no_follow']"
						:disabled="props.disabled"
						:label="t(control.label)"
						@input="updateField(control.key as keyof SeoValue, $event)"
					/>

					<!-- Warning message when either option is enabled -->
					<v-notice v-if="internalValue.no_index || internalValue.no_follow" type="warning" class="field full">
						<span>
							{{
								internalValue.no_index && internalValue.no_follow
									? t('seo_plugin.interface.hidden_and_not_followed')
									: internalValue.no_index
										? t('seo_plugin.interface.hidden_from_search')
										: t('seo_plugin.interface.links_not_followed_warning')
							}}
						</span>
					</v-notice>
				</div>
			</div>
		</div>

		<div v-else-if="currentTab === 'custom-fields'" :id="`${idPrefix}-panel`" role="tabpanel" :aria-labelledby="`${idPrefix}-tab-custom-fields`" class="tab-content form-grid">
			<!-- Custom Fields -->
			<div class="field">
				<v-form
					:fields="additionalFields"
					:model-value="internalValue.additional_fields"
					:initial-values="initialAdditionalFields"
					:disabled="props.disabled"
					@update:model-value="updateField('additional_fields', $event)"
				/>
			</div>
		</div>

		<div v-else-if="currentTab === 'analysis'" :id="`${idPrefix}-panel`" role="tabpanel" :aria-labelledby="`${idPrefix}-tab-analysis`" class="tab-content">
			<!-- Focus Keyphrase -->
			<FocusKeyphrase
				v-if="showFocusKeyphrase"
				:model-value="internalValue.focus_keyphrase || ''"
				:disabled="props.disabled"
				@update:model-value="updateField('focus_keyphrase', $event)"
			/>

			<!-- Analysis -->
			<Analysis
				:focus-keyphrase="internalValue.focus_keyphrase || ''"
				:title="internalValue.title || ''"
				:description="internalValue.meta_description || ''"
				:slug-field="slugField"
				:content-fields="contentFields"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '../shared/styles/shared.scss' as *;

.tabs-list {
	display: flex;
	gap: 0 0.5rem;
	padding: 0.25rem;
	margin-bottom: var(--theme--form--row-gap);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	flex-wrap: wrap;
}

/* Matches core's group-tabs interface (app/src/interfaces/group-tabs/tab-trigger.vue) */
.tab-trigger {
	position: relative;
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.625rem;
	border: var(--theme--border-width) solid transparent;
	border-radius: var(--theme--border-radius);
	background-color: transparent;
	color: var(--theme--foreground-subdued);
	font: inherit;
	font-weight: 600;
	cursor: pointer;
	transition:
		color var(--fast) var(--transition),
		background-color var(--fast) var(--transition),
		border-color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground-accent);
	}

	&[data-state='active'] {
		border-color: var(--theme--background-accent);
		background-color: var(--theme--background-accent);
		color: var(--theme--foreground-accent);
	}

	&:focus-visible {
		outline: var(--theme--border-width) solid var(--theme--primary);
		outline-offset: 1px;
	}
}

.tab-trigger .warning {
	margin-inline-start: 0.5rem;
	color: var(--theme--danger);
}

.tab-content {
	flex-grow: 1;
}

.mb-8 {
	margin-bottom: 1rem;
}

.info-icon {
	--v-icon-color: var(--theme--foreground-subdued);
}

.label {
	display: flex;
	align-items: center;
	gap: 4px;
}
</style>
