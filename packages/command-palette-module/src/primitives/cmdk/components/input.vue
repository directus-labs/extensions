<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useCommandMenu } from '../composables/use-command-menu';
import { ITEM_SELECTOR } from '../constants';
import { useForwardExpose } from '../utils/use-forward-expose';
import { injectCommandRootContext, injectState } from './command.vue';

const props = withDefaults(
	defineProps<{
		value?: string | null;
	}>(),
	{
		value: null,
	},
);

const emit = defineEmits<{
	change: [value: string | null];
}>();

const { forwardRef } = useForwardExpose();
const isControlled = computed(() => props.value !== null);
const search = useCommandMenu((state) => state.search);
const internalValue = useCommandMenu((state) => state.value);
const state = injectState();
const context = injectCommandRootContext();

const selectedItemId = computed(() => {
	const value = internalValue.value;
	const item = Array.from(
		context.listInnerRef.value?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [],
	).find((item) => item.dataset.value === value);

	return item?.id || undefined;
});

function onInput(event: Event) {
	if (!(event.target instanceof HTMLInputElement)) return;

	if (!isControlled.value) state.search = event.target.value;
	emit('change', event.target.value);
}

watch(
	() => props.value,
	(value) => {
		if (value !== null) {
			state.search = value;
		}
	},
);
</script>

<template>
	<input
		:id="context.inputId"
		:ref="forwardRef"
		cmdk-input
		autocomplete="off"
		autocorrect="off"
		spellcheck="false"
		aria-autocomplete="list"
		role="combobox"
		aria-expanded="true"
		:aria-controls="context.listId"
		:aria-labelledby="context.labelId"
		:aria-activedescendant="selectedItemId"
		type="text"
		:value="isControlled ? props.value : search"
		@input="onInput"
	>
</template>
