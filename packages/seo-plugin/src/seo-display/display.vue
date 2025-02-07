<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';

// @ts-expect-error - types not found in directus-format-title
import { formatTitle } from '@directus/format-title';
import { computed } from 'vue';

import SearchPreview from '../seo-interface/components/SearchPreview.vue';
import { useSeoField } from '../shared/composables/useSeoField';
import { seoRules } from '../shared/rulesets';

interface Props {
	value: SeoValue;
	collection: string;
	interface: string;
	interfaceOptions: SeoInterfaceOptions;
	type: string;
	field: string;
	showSearchPreview?: boolean;
}

const props = defineProps<Props>();

const { state: titleState } = useSeoField(computed(() => props.value?.title), seoRules.title);
const { state: descriptionState } = useSeoField(computed(() => props.value?.meta_description), seoRules.meta_description);

// Calculate the status of the additional fields.
const additionalFieldsStatus = computed(() => {
	const fields = props.interfaceOptions.additionalFields;
	if (!fields?.length)
		return null;

	const fieldValues = props.value.additional_fields;

	const isFieldFilled = (field: any) =>
		fieldValues?.[field.field] != null
		&& fieldValues[field.field] !== '';

	const totalFields = fields.length;
	const filledFields = fields.filter(isFieldFilled).length;
	const requiredFields = fields.filter((field) => field.required);
	const missingRequiredFields = requiredFields.filter((field) => !isFieldFilled(field)).length;

	if (missingRequiredFields > 0) {
		return {
			icon: 'error',
			class: 'error',
			text: `${missingRequiredFields} required`,
		};
	}

	return filledFields === totalFields
		? { icon: 'check', class: 'success' }
		: {
				icon: 'warning',
				class: 'warning',
				text: `${totalFields - filledFields} optional`,
			};
});

// Calculate the status of the SEO display.
const status = computed(() => {
	if (props.value?.no_index) {
		return {
			icon: 'visibility_off',
			color: 'neutral',
		};
	}

	if (!props.value?.title || !props.value?.meta_description) {
		return {
			icon: 'error',
			color: 'error',
		};
	}

	// Check for missing required additional fields
	const hasRequiredFields = props.interfaceOptions.additionalFields?.some(
		(field: any) => field.required
			&& (!props.value.additional_fields?.[field.field]
				|| props.value.additional_fields[field.field] === ''),
	);

	if (hasRequiredFields) {
		return {
			icon: 'warning',
			color: 'warning',
		};
	}

	if (titleState.value?.status !== 'ideal' || descriptionState.value?.status !== 'ideal') {
		return {
			icon: 'warning',
			color: 'warning',
		};
	}

	return {
		icon: 'check',
		color: 'success',
	};
});
</script>

<template>
	<div class="seo-display">
		<v-menu trigger="hover" :delay="300" show-arrow>
			<template #activator>
				<v-chip outlined>
					<v-icon :name="status.icon" :class="status.color" />
				</v-chip>
			</template>
			<div class="preview-box">
				<label class="header-label field-label type-label">
					<span>SEO Status</span>
					<v-icon v-tooltip="'Quick checks to see if your SEO is optimized.'" name="info" small class="info-icon neutral" />
				</label>
				<div class="preview-box-item border-bottom-dash">
					<div class="left">
						<h3>Title</h3>
					</div>
					<div>
						<v-chip small label>
							<v-icon
								small
								:name="titleState.icon.name"
								:class="titleState.icon.class"
								class="chip-icon"
							/>
							<span v-if="titleState.status !== 'ideal'">{{ formatTitle(titleState.status) }}</span>
						</v-chip>
					</div>
				</div>
				<div class="preview-box-item border-bottom-dash">
					<div class="left">
						<h3>Meta Description</h3>
					</div>
					<div>
						<v-chip small label>
							<v-icon
								small
								:name="descriptionState.icon.name"
								:class="descriptionState.icon.class"
								class="chip-icon"
							/>
							<span v-if="descriptionState.status !== 'ideal'">{{ formatTitle(descriptionState.status) }}</span>
						</v-chip>
					</div>
				</div>

				<!-- OG Image -->
				<div v-if="interfaceOptions.showOgImage" class="preview-box-item border-bottom-dash">
					<div class="left">
						<h3>OG Image</h3>
					</div>
					<div>
						<v-chip small label>
							<v-icon :name="value.og_image ? 'check' : 'error'" :class="value.og_image ? 'success' : 'error'" class="chip-icon" small />
							{{ value.og_image ? '' : 'Missing' }}
						</v-chip>
					</div>
				</div>

				<!-- Additional Fields -->
				<div v-if="additionalFieldsStatus" class="preview-box-item border-bottom-dash">
					<div class="left">
						<h3>Additional Fields</h3>
					</div>
					<div>
						<v-chip small label>
							<v-icon :name="additionalFieldsStatus.icon" :class="additionalFieldsStatus.class" class="chip-icon" small />
							<span v-if="additionalFieldsStatus.text" v-text="additionalFieldsStatus.text" />
						</v-chip>
					</div>
				</div>

				<!-- No Index -->
				<div v-if="interfaceOptions.showNoIndex" class="preview-box-item">
					<v-chip v-if="value.no_index" small label>
						<v-icon
							name="visibility_off"
							class="chip-icon"
							small
						/>
						{{ 'Hidden from search' }}
					</v-chip>
					<v-chip v-if="value.no_follow" small label>
						<v-icon name="link_off" class="chip-icon" small />
						{{ 'Links not followed' }}
					</v-chip>
				</div>

				<!-- Omitting the sitemap settings here on purpose. @TODO: Is it worth adding? -->

				<!-- Search Preview -->
				<SearchPreview
					v-if="showSearchPreview"
					class="full-width"
					:title="value.title"
					:meta-description="value.meta_description"
					:collection="collection"
				/>
			</div>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.seo-display {
	display: flex;
}

.neutral {
	--v-icon-color: var(--theme--foreground-subdued);
}

.warning {
	--v-icon-color: var(--theme--warning);
}
.success {
	--v-icon-color: var(--theme--success);
}
.error {
	--v-icon-color: var(--theme--danger);
}

.header-label {
	display: flex;
	align-items: center;
	gap: 4px;
}

.preview-box {
	display: flex;
	flex-direction: column;
	min-width: 300px;
	padding: 12px;
	max-width: 400px;
	width: 100%;
	gap: 12px;
	align-items: flex-start;

	&-item {
		display: flex;
		justify-content: space-between;
		width: 100%;
		gap: 4px;

		.left {
			display: flex;
			align-items: center;
			gap: 4px;
		}

		&-progress {
			width: 50px;
		}

		&.border-top {
			border-top: 1px dashed var(--theme--border-color);
		}

		&.border-bottom-dash {
			border-bottom: 1px dashed var(--theme--border-color);
		}
	}
}

.full-width {
	width: 100%;
}

.chip-icon {
	margin-right: 4px;
}
</style>
