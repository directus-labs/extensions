<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui';
import { ref, watch, computed } from 'vue';

import type { InterfaceProps } from '../shared/types';
import CardPreview from '../shared/CardPreview.vue';

const props = withDefaults(defineProps<InterfaceProps & { value: string | number | null }>(), {
	disabled: false,
	choices: null,
	gridSize: 4,
	enableSearch: false,
});

const emit = defineEmits(['input']);

const selectedValue = ref(props.value);
const searchQuery = ref('');

watch(
	() => props.value,
	(newValue) => {
		selectedValue.value = newValue;
	}
);

function handleChange(value: string) {
	selectedValue.value = value;
	emit('input', value);
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

		<RadioGroupRoot v-model="selectedValue" :disabled="disabled" class="group" @update:modelValue="handleChange">
			<transition-group name="list" tag="div" class="grid" :style="gridColumns">
				<RadioGroupItem
					v-for="choice in filteredChoices"
					:key="choice.value"
					:value="choice.value"
					class="interface radio-root"
					:class="{ active: selectedValue === choice.value, gray: selectedValue && selectedValue !== choice.value }"
				>
					<CardPreview
						:choice="choice"
						:is-selected="selectedValue === choice.value"
						:disabled="disabled"
						selection-type="radio"
					/>
				</RadioGroupItem>
			</transition-group>
		</RadioGroupRoot>
	</div>
</template>

<style lang="scss" scoped>
@import '../shared/cards.scss';

.card-select-interface {
  @include cards-interface;
}

:deep(.radio-root) {
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
