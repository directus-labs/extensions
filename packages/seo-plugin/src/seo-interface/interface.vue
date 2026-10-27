<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
// @ts-expect-error - types missing
import { formatTitle } from '@directus/format-title';

import { computed, onMounted, ref, toRefs } from 'vue';
import OgImagePreview from '../shared/components/OgImagePreview.vue';
import SearchPreview from '../shared/components/SearchPreview.vue';

import Analysis from './analysis/components/Analysis.vue';
import FocusKeyphrase from './components/FocusKeyphrase.vue';

import MetaDescriptionField from './components/MetaDescriptionField.vue';
import OgImage from './components/OgImage.vue';
import TitleField from './components/TitleField.vue';
import { searchControls, sitemapFields } from './fields';

interface Props extends SeoInterfaceOptions {
	collection: string;
	field: string;
	primaryKey?: string | number | null;
	value: SeoValue | null;
	disabled?: boolean;
	values: Record<string, unknown>;
	canonicalUrl?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<(event: 'input', value: SeoValue) => void>();

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

const internalValue = computed({
	get() {
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
	},
	set(newValue: SeoValue) {
		value.value = newValue;
	},
});

// Seed defaults on new items so the display has something to score. On existing items this would mark the form dirty on open.
onMounted(() => {
	if (!value.value && props.primaryKey === '+') {
		emit('input', internalValue.value);
	}
});

function updateField(field: string, value: unknown) {
	const [key, subKey] = field.split('.') as [keyof SeoValue, string?];
	const updatedValue: Record<string, unknown> = { ...internalValue.value };
	updatedValue[key] = subKey ? { ...(updatedValue[key] as object), [subKey]: value } : value;
	emit('input', updatedValue as SeoValue);
}

/* Transform additional fields to proper format to use v-form within CustomFields component */
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

const showAdvancedTab = computed(() => props.showSitemap || props.showSearchControls);
const showCustomFieldsTab = computed(() => additionalFields.value?.length > 0);
const showAnalysisTab = computed(() => value.value && props.showFocusKeyphrase);

const tabs = computed(() => [
	{ value: 'metadata', label: 'Basic', show: true },
	{ value: 'advanced-settings', label: 'Advanced', show: showAdvancedTab.value },
	{ value: 'custom-fields', label: 'Custom Fields', show: showCustomFieldsTab.value },
	{ value: 'analysis', label: 'Keyphrase', show: !!showAnalysisTab.value },
].filter((tab) => tab.show));

const activeTab = ref('metadata');
// Fall back to Basic if the active tab disappears (e.g. its option is turned off)
const currentTab = computed(() => (tabs.value.some((tab) => tab.value === activeTab.value) ? activeTab.value : 'metadata'));
</script>

<template>
	<div class="seo-tabs">
		<div v-if="tabs.length > 1" class="tabs-list" role="tablist" aria-label="SEO Configuration">
			<button
				v-for="tab in tabs"
				:key="tab.value"
				type="button"
				role="tab"
				class="tab-trigger"
				:aria-selected="currentTab === tab.value"
				:data-state="currentTab === tab.value ? 'active' : 'inactive'"
				@click="activeTab = tab.value"
			>
				<span>{{ tab.label }}</span>
			</button>
		</div>

		<!-- v-if, not v-show: interfaces like the code editor measure their size on mount (#292) -->
		<div v-if="currentTab === 'metadata'" role="tabpanel" class="tab-content form-grid">
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
				:url="props.canonicalUrl"
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

		<div v-else-if="currentTab === 'advanced-settings'" role="tabpanel" class="tab-content form-grid">
			<!-- Sitemap Fields -->
			<div v-if="props.showSitemap" class="field">
				<label class="label field-label type-label">
					Sitemap Settings
					<v-icon v-tooltip="'Control how search engines crawl and index your site'" name="info" small class="info-icon" />
				</label>
				<div class="form-grid">
					<div v-for="sitemapField in sitemapFields" :key="sitemapField.key" class="field half">
						<v-select
							:model-value="internalValue.sitemap?.[sitemapField.key as keyof SeoValue['sitemap']] || ''"
							:items="sitemapField.options"
							:disabled="props.disabled"
							:placeholder="sitemapField.label"
							@update:model-value="updateField(`sitemap.${sitemapField.key}` as 'sitemap.priority' | 'sitemap.change_frequency', $event)"
						>
							<template #prepend>
								<v-icon :name="sitemapField.icon" />
							</template>
						</v-select>
						<small v-if="sitemapField.tooltip" class="hint">{{ sitemapField.tooltip }}</small>
					</div>
				</div>
			</div>

			<!-- Search Engine Controls -->
			<div v-if="props.showSearchControls" class="field">
				<label class="label field-label type-label">
					Search Engine Controls
					<v-icon v-tooltip="'Control how search engines interact with this page'" name="info" small class="info-icon" />
				</label>
				<div class="form-grid">
					<interface-boolean
						v-for="control in searchControls"
						:key="control.key"
						class="field half"
						:value="internalValue[control.key as 'no_index' | 'no_follow']"
						:disabled="props.disabled"
						:label="control.label"
						@input="updateField(control.key as keyof SeoValue, $event)"
					/>

					<!-- Warning message when either option is enabled -->
					<v-notice v-if="internalValue.no_index || internalValue.no_follow" type="warning" class="field full">
						<span>
							{{
								internalValue.no_index && internalValue.no_follow
									? "This page will be hidden from search engines and its links won't be followed"
									: internalValue.no_index
										? 'This page will be hidden from search engines'
										: "Links on this page won't be followed by search engines"
							}}
						</span>
					</v-notice>
				</div>
			</div>
		</div>

		<div v-else-if="currentTab === 'custom-fields'" role="tabpanel" class="tab-content form-grid">
			<!-- Custom Fields -->
			<div class="field">
				<v-form
					:fields="additionalFields"
					:model-value="internalValue.additional_fields"
					:disabled="props.disabled"
					@update:model-value="updateField('additional_fields', $event)"
				/>
			</div>
		</div>

		<div v-else-if="currentTab === 'analysis'" role="tabpanel" class="tab-content">
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
	position: relative;
	display: flex;
	flex-shrink: 0;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
	margin-bottom: 16px;
}

.tab-trigger {
	background-color: transparent;
	padding: 10px 16px;
	min-width: fit-content;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 15px;
	color: var(--theme--foreground-normal);
	user-select: none;
	border: none;
	border-radius: var(--theme--border-radius, 4px) var(--theme--border-radius, 4px) 0 0;
	cursor: pointer;
	outline: none;
	transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

	&:hover {
		color: var(--theme--primary);
		background-color: var(--theme--background-subdued);
	}

	&[data-state='active'] {
		color: var(--theme--primary);
		box-shadow: inset 0 -2px 0 var(--theme--primary);
	}

	&:focus-visible {
		position: relative;
		box-shadow: 0 0 0 var(--theme--border-width) var(--theme--primary);
	}
}

.tab-content {
	flex-grow: 1;
	outline: none;
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
