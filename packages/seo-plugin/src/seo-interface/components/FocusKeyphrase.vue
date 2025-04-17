<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

const props = defineProps<{
	modelValue: string;
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
			<div v-else :class="{ disabled }" class="keyphrase-display">
				<div v-tooltip="disabled ? null : 'Click to edit'" class="keyphrase-text" :class="{ 'not-clickable': disabled }" @click="enableEdit">
					<v-chip v-if="value">
						{{ value }}
					</v-chip>
					<span v-else class="keyphrase-placeholder">Enter the main keyword or phrase</span>
				</div>
				<v-button v-if="!disabled" v-tooltip="'Edit'" small secondary icon @click.stop="enableEdit">
					<v-icon name="edit" />
				</v-button>
				<v-icon v-else v-tooltip="'Input disabled'" name="lock" small class="lock-icon" />
			</div>
			<div class="hint">
				The main phrase you want this content to rank for in search engines.
			</div>
		</div>
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
	flex-grow: 1;
	width: 100%;
	align-items: start;
	gap: 8px;

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
	/* flex-grow: 1; */
	padding-right: 8px;
	color: var(--theme----theme--form--field--input--foreground);
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
