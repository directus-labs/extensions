<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';

const props = withDefaults(
	defineProps<{
		value: (string | null | undefined)[] | null | undefined;
		addLabel?: string;
		placeholder?: string;
		limit?: number;
		disabled?: boolean;
		size?: 'small' | 'normal';
	}>(),
	{
		addLabel: 'Add New',
		placeholder: 'No Items',
		size: 'normal',
	}
);

const emit = defineEmits<{
	(e: 'input', value: (string | null)[]): void;
}>();

console.log('props', props);
const { t } = useI18n();

const localItems = ref<(string | null)[]>([]);
const inputRefs = ref<HTMLInputElement[]>([]);

const isEmpty = computed(() => localItems.value.length === 0);

const showAddNew = computed(() => {
	if (props.disabled) return false;
	if (!props.limit) return true;
	return localItems.value.length < props.limit;
});

const addLabel = computed(() => {
    return t(props.addLabel);
});

watch(
	() => props.value,
	(newValue) => {
		if (Array.isArray(newValue)) {
			localItems.value = newValue.map((item) => (item === undefined ? null : item));
		} else if (typeof newValue === 'string') {
			try {
				const parsedValue = JSON.parse(newValue);
				localItems.value = Array.isArray(parsedValue)
					? parsedValue.map((item) => (item === undefined ? null : item))
					: [];
			} catch (error) {
				console.error('Failed to parse JSON value:', error);
				localItems.value = [];
			}
		} else if (newValue === null || newValue === undefined) {
			// Initialize with an empty array for local state, but don't emit
			localItems.value = [];
		} else {
			localItems.value = [];
		}
	},
	{ immediate: true }
);

function addItem() {
	if (props.limit && localItems.value.length >= props.limit) {
		return;
	}

	localItems.value.push('');
	emitUpdate();

	nextTick(() => {
		focusInput(localItems.value.length - 1);
	});
}

function updateItem(index: number, value: string) {
	localItems.value[index] = value;
	emitUpdate();
}

function removeItem(index: number) {
	localItems.value.splice(index, 1);
	emitUpdate();

	nextTick(() => {
		if (localItems.value.length > 0) {
			focusInput(Math.max(0, index - 1));
		}
	});
}

function emitUpdate() {
	const filteredItems = localItems.value.filter((item) => item !== null && item.trim() !== '');
	if (filteredItems.length > 0 || props.value !== null) {
		emit('input', filteredItems);
	}
}

function focusInput(index: number) {
	nextTick(() => {
		if (inputRefs.value[index]) {
			inputRefs.value[index].focus();
		}
	});
}

function onKeyDown(event: KeyboardEvent, index: number) {
	const input = event.target as HTMLInputElement;

	switch (event.key) {
		case 'ArrowUp':
			if (index > 0) {
				event.preventDefault();
				focusInput(index - 1);
			}
			break;
		case 'ArrowDown':
			if (index < localItems.value.length - 1) {
				event.preventDefault();
				focusInput(index + 1);
			}
			break;
		case 'Enter':
			if (input.value.trim() !== '') {
				if (index === localItems.value.length - 1) {
					addItem();
				} else {
					focusInput(index + 1);
				}
				event.preventDefault();
			}
			break;
		case 'Backspace':
			if (input.selectionStart === 0 && input.selectionEnd === 0) {
				event.preventDefault();
				if (index > 0) {
					const prevValue = localItems.value[index - 1] || '';
					const currentValue = input.value;
					updateItem(index - 1, prevValue + currentValue);
					removeItem(index);
					nextTick(() => {
						if (inputRefs.value[index - 1]) {
							const prevInput = inputRefs.value[index - 1];
							prevInput.focus();
							prevInput.setSelectionRange(prevValue.length, prevValue.length);
						}
					});
				}
			} else if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
				event.preventDefault();
				if (localItems.value.length > 1) {
					removeItem(index);
				} else {
					updateItem(index, '');
				}
			} else if (input.value.length === 0 || (input.value.length === 1 && input.selectionStart === 1)) {
				event.preventDefault();
				if (index > 0) {
					const prevValue = localItems.value[index - 1] || '';
					removeItem(index);
					nextTick(() => {
						if (inputRefs.value[index - 1]) {
							const prevInput = inputRefs.value[index - 1];
							prevInput.focus();
							prevInput.setSelectionRange(prevValue.length, prevValue.length);
						}
					});
				} else {
					updateItem(index, '');
				}
			}
			break;
	}
}

function onPaste(event: ClipboardEvent, index: number) {
	event.preventDefault();
	const pastedText = event.clipboardData?.getData('text');
	if (!pastedText) return;

	const lines = pastedText.split(/\r?\n/).filter((line) => line.trim() !== '');

	if (lines.length === 1) {
		updateItem(index, lines[0]);
	} else {
		updateItem(index, lines[0]);
		for (let i = 1; i < lines.length; i++) {
			if (props.limit && localItems.value.length >= props.limit) {
				break;
			}
			addItem();
			updateItem(localItems.value.length - 1, lines[i]);
		}
	}

	nextTick(() => {
		focusInput(index + lines.length - 1);
	});
}

function onDragEnd() {
	emitUpdate();
}
</script>

<template>
	<div class="custom-list">
		<v-notice v-if="isEmpty">
			{{ placeholder }}
		</v-notice>
		<draggable
			v-else
			v-model="localItems"
			:disabled="disabled"
			item-key="index"
			handle=".drag-handle"
			:force-fallback="true"
			class="list-items"
			@end="onDragEnd"
		>
			<template #item="{ element, index }">
				<div :key="index" class="list-item">
					<v-input
						:ref="
							(el) => {
								if (el) inputRefs[index] = el.$el.querySelector('input');
							}
						"
						:model-value="element ?? ''"
						:small="size === 'small'"
						@update:model-value="(value) => updateItem(index, value)"
						@keydown="(event) => onKeyDown(event, index)"
						@paste="(event) => onPaste(event, index)"
					>
						<template #prepend>
							<v-icon name="drag_handle" class="drag-handle" aria-label="Drag to reorder" />
						</template>
						<template #append>
							<v-icon name="close" class="remove-icon" @click="removeItem(index)" />
						</template>
					</v-input>
				</div>
			</template>
		</draggable>
		<v-button v-if="showAddNew" class="add-new" :small="size === 'small'" @click="addItem">
			{{ addLabel }}
		</v-button>
	</div>
</template>

<style scoped>
.custom-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.list-items {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.list-item {
	display: flex;
	align-items: center;
	gap: 8px;
}
.remove-icon {
	cursor: pointer;
	color: var(--theme--form--field--input--foreground-subdued);
}
.remove-icon:hover {
	color: var(--theme--danger);
}
.add-new {
	align-self: flex-start;
	margin-top: 8px;
}
.drag-handle {
	cursor: move;
	--v-icon-color: var(--theme--foreground);
}
</style>
