<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core';
import { computed, ref } from 'vue';

const props = defineProps<{
	modelValue: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const value = computed({
	get: () => props.modelValue || '',
	set: (val: string) => emit('update:modelValue', val),
});

const inputRef = ref<HTMLElement | null>(null);
const isEditing = ref<boolean>(!props.modelValue);

function enableEdit() {
	isEditing.value = true;
}

function disableEdit() {
	isEditing.value = false;
}

onClickOutside(inputRef, () => {
	disableEdit();
});

onKeyStroke('Enter', (e) => {
	if (isEditing.value) {
		e.preventDefault();
		disableEdit();
	}
});
</script>

<template>
	<div class="focus-keyphrase">
		<div class="field">
			<div class="type-label">
				Focus Keyphrase
			</div>

			<template v-if="isEditing">
				<v-input
					ref="inputRef"
					v-model="value"
					autofocus
					placeholder="Enter the main keyword or phrase for this content"
					@blur="disableEdit"
				/>
			</template>

			<div v-else v-tooltip="'Click to edit'" class="keyphrase-display">
				<span class="keyphrase-text" @click="enableEdit">
					<span v-if="value">{{ value }}</span>
					<span v-else class="keyphrase-placeholder">Enter the main keyword or phrase for this content</span>
				</span>

				<v-button v-tooltip="'Edit'" x-small secondary icon @click.stop="enableEdit">
					<v-icon name="edit" />
				</v-button>
			</div>

			<div class="hint">
				The main phrase you want this content to rank for in search engines
			</div>
		</div>
	</div>
</template>

<style scoped>
.focus-keyphrase {
	margin-bottom: 24px;
}

.field {
	margin-bottom: 12px;
}

.type-label {
	font-size: 14px;
	margin-bottom: 4px;
	color: var(--theme--foreground);
}

.hint {
	margin-top: 4px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.keyphrase-display {
	display: flex;
	align-items: center;
	min-height: var(--theme--form--field--input--height);
}

.keyphrase-text {
	flex-grow: 1;
	text-decoration: underline;
	cursor: pointer;
	color: var(--theme--primary);
}

.keyphrase-placeholder {
	color: var(--theme--form--field--input--foreground-subdued);
}
</style>
