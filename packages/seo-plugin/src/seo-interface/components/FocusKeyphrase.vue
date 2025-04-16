<script setup lang="ts">
import type { Ref } from 'vue';
import { get, set } from 'lodash-es';
import { computed, inject } from 'vue';

import FocusKeyphraseAnalysis from './FocusKeyphraseAnalysis.vue';
import FocusKeyphraseInput from './FocusKeyphraseInput.vue';

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

const values = inject('values') as Ref<Record<string, any>>;

// Get slug and content fields for keyphrase analysis
const slugValue = computed(() => {
	if (!props.slugField || !values.value) return null;
	return get(values.value, props.slugField);
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
	<div class="field">
		<label class="label field-label type-label">Keyword Analysis</label>
		<FocusKeyphraseInput
			:model-value="value"
			:disabled="disabled"
			@update:model-value="emit('update:modelValue', $event)"
		/>

		<FocusKeyphraseAnalysis
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
.focus-keyphrase-container {
	margin-bottom: 24px;
}

.field {
	display: flex;
	flex-direction: column;
}
.label {
	margin-bottom: 0.5rem;
}
</style>
