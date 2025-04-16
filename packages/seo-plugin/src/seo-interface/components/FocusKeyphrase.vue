<script setup lang="ts">
import type { Ref } from 'vue';
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { get } from 'lodash-es';
import { computed, inject, ref } from 'vue';

import SeoAnalysis from './Analysis/SeoAnalysis.vue';

const props = defineProps<{
	modelValue: string;
	slugField?: string;
	contentFields?: string[] | string | null;
	title: string;
	description: string;
	slug: string | null | undefined;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const value = computed({
	get: () => props.modelValue || '',
	set: (val: string) => emit('update:modelValue', val),
});

const inputRef = ref<HTMLElement | null>(null);
const isEditing = ref<boolean>(!props.modelValue && !props.disabled);

function enableEdit() {
	if (props.disabled) return;
	isEditing.value = true;
}

function disableEdit() {
	isEditing.value = false;
}

onClickOutside(inputRef, () => {
	if (!props.disabled) {
		disableEdit();
	}
});

onKeyStroke('Enter', (e) => {
	if (isEditing.value && !props.disabled) {
		e.preventDefault();
		disableEdit();
	}
});

const values = inject('values') as Ref<Record<string, any>>;

const slugValue = computed(() => {
	if (!props.slugField || !values.value) return null;
	const rawSlug = get(values.value, props.slugField);
	return typeof rawSlug === 'string' ? rawSlug : null;
});

const contentFieldValues = computed(() => {
	if (!props.contentFields || !values.value) return {};

	const fieldsArray = Array.isArray(props.contentFields)
		? props.contentFields
		: props.contentFields?.split(',').map((f) => f.trim()) || [];

	const result: Record<string, unknown> = {};

	for (const field of fieldsArray) {
		if (field && values.value[field] !== undefined) {
			result[field] = values.value[field];
		}
	}

	return result;
});

const contentFieldNames = computed(() => {
	if (!props.contentFields) return [];
	return Array.isArray(props.contentFields)
		? props.contentFields
		: props.contentFields?.split(',').map((f) => f.trim()) || [];
});
</script>

<template>
	<div class="field focus-keyphrase-container">
		<div class="field-input-group">
			<label class="label field-label type-label">Focus Keyphrase</label>
			<template v-if="isEditing && !disabled">
				<v-input
					ref="inputRef"
					v-model="value"
					autofocus
					placeholder="Enter the main keyword or phrase"
					@blur="disableEdit"
				/>
			</template>
			<div v-else v-tooltip="disabled ? null : 'Click to edit'" class="keyphrase-display" :class="{ disabled }">
				<span class="keyphrase-text" :class="{ 'not-clickable': disabled }" @click="enableEdit">
					<span v-if="value">{{ value }}</span>
					<span v-else class="keyphrase-placeholder">Enter the main keyword or phrase</span>
				</span>
				<v-button v-if="!disabled" v-tooltip="'Edit'" x-small secondary icon @click.stop="enableEdit">
					<v-icon name="edit" />
				</v-button>
				<v-icon v-else v-tooltip="'Input disabled'" name="lock" small class="lock-icon" />
			</div>
			<div class="hint">
				The main phrase you want this content to rank for in search engines.
			</div>
		</div>

		<SeoAnalysis
			v-if="value"
			:focus-keyphrase="value"
			:title="title"
			:description="description"
			:slug="slugValue"
			:content-data="contentFieldValues"
			:content-field-names="contentFieldNames"
		/>
	</div>
</template>

<style scoped>
.focus-keyphrase-container {}

.field {
	display: flex;
	flex-direction: column;
}

.field-input-group {
	margin-bottom: 1.5rem;
}

.label {
	margin-bottom: 0.5rem;
	font-weight: bold;
}

.type-label {}

.hint {
	margin-top: 4px;
	font-size: 0.8rem;
	color: var(--theme--foreground-subdued);
}

.keyphrase-display {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: var(--theme--form--field--input--height);
	padding: 0 var(--theme--form--field--input--padding);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
	cursor: pointer;
	transition: border-color var(--theme--transitions-fast) ease-in-out;
}
.keyphrase-display:not(.disabled):hover {
	border-color: var(--theme--primary);
}

.keyphrase-display.disabled {
	cursor: not-allowed;
	background-color: var(--theme--background-subdued);
	border-color: var(--theme--form--field--input--border-color-disabled);
}

.keyphrase-text {
	flex-grow: 1;
	padding-right: 8px;
	color: var(--theme--form--field--input--foreground);
}
.keyphrase-text.not-clickable {
	cursor: not-allowed;
}

.keyphrase-placeholder {
	color: var(--theme--form--field--input--foreground-subdued);
	font-style: italic;
}

.lock-icon {
	color: var(--theme--foreground-subdued);
}

:deep(.v-input) {
	width: 100%;
}
</style>
