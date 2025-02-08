<script setup lang="ts">
import type { SeoValue } from '../shared/types/seo';

// @ts-expect-error - types missing
import { formatTitle } from '@directus/format-title';
// @ts-expect-error - types missing
import { set } from 'lodash-es';
import { computed, defineEmits, defineProps, toRefs } from 'vue';

import SearchPreview from '../shared/components/SearchPreview.vue';
import MetaDescriptionField from './components/MetaDescriptionField.vue';
import OgImage from './components/OgImage.vue';
import TitleField from './components/TitleField.vue';
import { searchControls, sitemapFields } from './fields';

const props = defineProps<{
	value: SeoValue | null;
	showSearchControls?: boolean;
	showSitemap?: boolean;
	showOgImage?: boolean;
	additionalFields?: any[];
	collection?: string;
	titleTemplate?: string;
	descriptionTemplate?: string;
	disabled?: boolean;
	defaultChangeFrequency?: string;
	defaultPriority?: string;
}>();

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

function updateField(field: string, value: any) {
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
</script>

<template>
	<div class="form-grid">
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

		<!-- Sitemap Fields -->
		<div v-if="props.showSitemap" class="field">
			<label class="label field-label type-label">
				Sitemap Settings
				<v-icon v-tooltip="'Control how search engines crawl and index your site'" name="info" small class="info-icon" />
			</label>
			<div class="form-grid">
				<div v-for="sitemapField in sitemapFields" :key="sitemapField.key">
					<v-select
						:model-value="internalValue.sitemap?.[sitemapField.key] || ''"
						:items="sitemapField.options"
						:disabled="props.disabled"
						:placeholder="sitemapField.label"
						@update:model-value="updateField(`sitemap.${sitemapField.key}` as keyof SeoValue, $event)"
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
					:model-value="internalValue[control.key]"
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

		<!-- Custom Fields -->
		<div v-if="additionalFields?.length" class="field">
			<v-divider class="mb-8" inline-title>
				Additional SEO Fields
			</v-divider>
			<v-form
				:fields="additionalFields"
				:model-value="internalValue.additional_fields"
				@update:model-value="updateField('additional_fields', $event)"
			/>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@use '../shared/styles/shared.scss' as *;

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
