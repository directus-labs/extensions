<script setup lang="ts">
import { CheckboxGroupRoot, CheckboxRoot } from 'reka-ui';
import { ref, watch, computed } from 'vue';

import type { InterfaceProps } from '../shared/types';
import CardPreview from '../shared/CardPreview.vue';

const props = withDefaults(defineProps<InterfaceProps & { value: string[] }>(), {
	disabled: false,
	choices: null,
	gridSize: 4,
	enableSearch: false,
});

const emit = defineEmits(['input']);

const selectedValues = ref<string[]>(props.value || []);
const searchQuery = ref('');

watch(
	() => props.value,
	(newValue) => {
		selectedValues.value = newValue || [];
	}
);

function handleChange(values: string[]) {
	selectedValues.value = values;
	emit('input', values);
}

const gridColumns = computed(() => ({
	'--columns-xl': props.gridSize,
	'--columns-lg': Math.min(props.gridSize, 3),
	'--columns-md': Math.min(props.gridSize, 2),
	'--columns-sm': 1,
}));

const filteredChoices = computed(() => {
	if (!searchQuery.value) return props.choices;
	return props.choices?.filter((choice) => choice.text.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

function clearSearch() {
	searchQuery.value = '';
}
</script>

<template>
	<div class="card-select-interface content">
		<v-input v-if="enableSearch" v-model="searchQuery" placeholder="Search..." small type="search">
			<template #prepend>
				<v-icon name="search" />
			</template>
			<template #append>
				<v-icon v-if="searchQuery" name="close" clickable @click="clearSearch" />
			</template>
		</v-input>

		<CheckboxGroupRoot
			v-model="selectedValues"
			:disabled="disabled"
			class="group"
			@update:modelValue="handleChange"
			:loop="true"
			role="group"
		>
			<transition-group name="list" tag="div" class="grid" :style="gridColumns">
				<div
					v-for="choice in filteredChoices"
					:key="choice.value"
					class="interface"
					:class="{
						active: selectedValues.includes(choice.value),
						gray: selectedValues.length > 0 && !selectedValues.includes(choice.value),
					}"
				>
					<CheckboxRoot
						:value="choice.value"
						:disabled="disabled"
						class="checkbox-root"
						:aria-label="choice.text"
						tabindex="0"
					>
						<CardPreview
							:choice="choice"
							:is-selected="selectedValues.includes(choice.value)"
							:disabled="disabled"
							selection-type="checkbox"
						/>
					</CheckboxRoot>
				</div>
			</transition-group>
		</CheckboxGroupRoot>
	</div>
</template>

<style lang="scss" scoped>
@import '../shared/cards.scss';

.card-select-interface {
  @include cards-interface;
}

:deep(.checkbox-root) {
  width: 100%;
  outline: none;
  display: block;
  text-align: left;

&:focus-visible {
    outline: none;

    .preview {
      outline: 2px solid var(--theme--primary);
      outline-offset: 2px;
      border-color: var(--theme--primary);
    }
  }
}
</style>
