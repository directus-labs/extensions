<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSeoI18n } from '../../lang/use-seo-i18n';

const props = defineProps<{
	modelValue: string;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const { t } = useSeoI18n();

const value = computed({
	get: () => props.modelValue || '',
	set: (val: string) => emit('update:modelValue', val),
});

const isEditing = ref<boolean>(!props.modelValue && !props.disabled);
// Only grab focus when the user asks to edit, not when the tab opens (keyboard users would get stuck in the input)
const focusInput = ref(false);

function enableEdit() {
	if (props.disabled) return;
	focusInput.value = true;
	isEditing.value = true;
}

function disableEdit() {
	isEditing.value = false;
}
</script>

<template>
	<div class="field focus-keyphrase-container">
		<div class="field-input-group">
			<label class="label field-label type-label">{{ t('seo_plugin.ui.focus_keyphrase') }}</label>
			<template v-if="isEditing && !disabled">
				<v-input
					v-model="value"
					:autofocus="focusInput"
					:placeholder="t('seo_plugin.ui.keyphrase_placeholder')"
					@blur="disableEdit"
					@keydown.enter.prevent="disableEdit"
				/>
			</template>
			<div v-else :class="{ disabled }" class="keyphrase-display">
				<div v-tooltip="disabled ? null : t('seo_plugin.ui.click_to_edit')" class="keyphrase-text" :class="{ 'not-clickable': disabled }" @click="enableEdit">
					<v-chip v-if="value">
						{{ value }}
					</v-chip>
					<span v-else class="keyphrase-placeholder">{{ t('seo_plugin.ui.keyphrase_placeholder') }}</span>
				</div>
				<v-button v-if="!disabled" v-tooltip="t('edit')" small secondary icon @click.stop="enableEdit">
					<v-icon name="edit" />
				</v-button>
				<v-icon v-else v-tooltip="t('seo_plugin.ui.input_disabled')" name="lock" small class="lock-icon" />
			</div>
			<div class="hint">
				{{ t('seo_plugin.ui.keyphrase_hint') }}
			</div>
		</div>
	</div>
</template>

<style scoped>
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
	transition: border-color var(--fast) var(--transition);
}
.keyphrase-display:not(.disabled):hover {
	border-color: var(--theme--primary);
}

.keyphrase-display.disabled {
	cursor: not-allowed;
	background-color: var(--theme--background-subdued);
	border-color: var(--theme--form--field--input--border-color);
}

.keyphrase-text {
	/* flex-grow: 1; */
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
