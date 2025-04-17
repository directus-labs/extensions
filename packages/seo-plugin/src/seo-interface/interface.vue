<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
// @ts-expect-error - types missing
import { formatTitle } from '@directus/format-title';

// @ts-expect-error - types missing
import { get, set } from 'lodash-es';
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
import { computed, defineEmits, defineProps, ref, toRefs, watch } from 'vue';
import SearchPreview from '../shared/components/SearchPreview.vue';

import SeoAnalysis from './components/Analysis/SeoAnalysis.vue';
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

const emit = defineEmits<{
	(e: 'input', value: SeoValue): void;
}>();

const { value } = toRefs(props);

const internalValue = computed({
	get() {
		if (!value.value) {
			// Return default structure with sitemap defaults when value is null
			return {
				title: '',
				meta_description: '',
				focus_keyphrase: '',
				og_image: '',
				sitemap: {
					priority: props.defaultPriority || '0.5',
					change_frequency: props.defaultChangeFrequency || 'weekly',
				},
				no_index: false,
				no_follow: false,
				additional_fields: {},
			};
		}

		// For existing values, ensure sitemap defaults are merged if not present
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

function updateField(field: string, value: unknown) {
	if (!props.value) {
		const newValue = set({}, field, value);
		emit('input', newValue as SeoValue);
		return;
	}

	const updatedValue = { ...props.value };
	set(updatedValue, field, value);
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

/* Computed property to extract content data for analysis */
</script>

<template>
	<TabsRoot class="fseo-tabs" default-value="metadata">
		<TabsList class="tabs-list" aria-label="SEO Configuration">
			<TabsIndicator class="tabs-indicator">
				<div class="indicator-bar" />
			</TabsIndicator>
			<TabsTrigger class="tab-trigger" value="metadata">
				<!-- <v-icon small name="settings" /> -->
				<span>Basic</span>
			</TabsTrigger>
			<TabsTrigger class="tab-trigger" value="advanced-settings">
				<!-- <v-icon small name="settings" /> -->
				<span>Advanced</span>
			</TabsTrigger>
			<TabsTrigger
				v-if="additionalFields?.length"
				class="tab-trigger"
				value="custom-fields"
			>
				<!-- <v-icon small name="settings" /> -->
				<span>Custom Fields</span>
			</TabsTrigger>
			<TabsTrigger v-if="value" class="tab-trigger" value="analysis">
				<!-- <v-icon small name="settings" /> -->
				<span>Keyphrase</span>
			</TabsTrigger>
		</TabsList>

		<TabsContent value="metadata" class="tab-content form-grid">
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

			<!-- OG Image Field -->
			<OgImage
				v-if="props.showOgImage"
				:value="internalValue.og_image"
				:disabled="props.disabled"
				class="field"
				@input="updateField('og_image', $event)"
			/>
		</TabsContent>

		<TabsContent value="advanced-settings" class="tab-content form-grid">
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
						:model-value="internalValue[control.key as 'no_index' | 'no_follow']"
						:disabled="props.disabled"
						:label="control.label"
						@update:model-value="updateField(control.key as keyof SeoValue, $event)"
					>
						<template #append>
							<v-icon
								v-tooltip="'Prevents search engines from indexing this page'"
								name="visibility_off"
								small
								class="info-icon"
							/>
						</template>
					</interface-boolean>

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
		</TabsContent>
		<TabsContent v-if="additionalFields?.length" value="custom-fields" class="tab-content form-grid">
			<!-- Custom Fields -->
			<div class="field">
				<v-form
					:fields="additionalFields"
					:model-value="internalValue.additional_fields"
					@update:model-value="updateField('additional_fields', $event)"
				/>
			</div>
		</TabsContent>

		<TabsContent v-if="value" value="analysis" class="tab-content">
			<!-- Focus Keyphrase -->
			<FocusKeyphrase
				v-if="showFocusKeyphrase"
				:model-value="internalValue.focus_keyphrase || ''"
				:title="internalValue.title"
				:description="internalValue.meta_description"
				:slug="slugField || ''"
				:slug-field="slugField"
				:content-fields="contentFields"
				:disabled="props.disabled"
				@update:model-value="updateField('focus_keyphrase', $event)"
			/>

			<!-- Analysis -->
			<SeoAnalysis
				:focus-keyphrase="value.focus_keyphrase || ''"
				:title="value.title"
				:description="value.meta_description"
				:slug="slugField || ''"
				:content-data="contentDataForAnalysis"
				:content-field-names="Array.isArray(contentFields) ? contentFields : (contentFields ? [contentFields] : [])"
			/>
		</TabsContent>
	</TabsRoot>
</template>

<style lang="scss" scoped>
@use '../shared/styles/shared.scss' as *;

.seo-tabs {}

.tabs-list {
	position: relative;
	display: flex;
	flex-shrink: 0;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	color: var(--header-color, var(--theme--foreground));
	margin-bottom: 16px;
}

.tabs-indicator {
	position: absolute;
	bottom: 0;
	left: 0;
	height: 2px;
	width: var(--reka-tabs-indicator-size);
	transform: translateX(var(--reka-tabs-indicator-position)) translateY(1px);
	transition: width 0.3s ease, transform 0.3s ease;
	will-change: width, transform;

	.indicator-bar {
		background-color: var(--theme--primary, #2ecda7);
		width: 100%;
		height: 100%;
		border-radius: 9999px;
	}
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
		color: var(--theme--primary, #2ecda7);
		background-color: var(--theme--background-subdued, #f0f4f8);
	}

	&[data-state='active'] {
		color: var(--theme--primary, #2ecda7);
	}

	&:focus-visible {
		position: relative;
		box-shadow: 0 0 0 var(--theme--border-width) var(--theme--primary, #2ecda7);
	}
}

.tab-content {
	flex-grow: 1;
	/* border: var(--theme--border-width) solid var(--theme--border-color);
	padding: var(--theme--form--field--input--padding); */
	outline: none;
	border-radius: var(--theme--border-radius, 4px);
	&[data-state='inactive'] {
		display: none;
	}
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
