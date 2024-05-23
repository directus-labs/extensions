<template>
	<div :style="{ '--meter-color': meterColor }" class="meter-container" v-tooltip="tooltip">
		<meter :value="percent" :min="min" :max="max"></meter>
		<p v-if="indicator" class="text">{{ percent }}%</p>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	value: number;
	min: number;
	max: number;
	indicator: boolean;
	label: string;
	color: string;
	disabled: boolean;
}>();

const emit = defineEmits<{
	input: [(value: number) => void];
}>();

function handleChange(value: number): void {
	emit('input', (value: number) => {});
}

// Helper Functions
function normalizePercent(value: number, min: number, max: number): number {
	if (min == max) {
		return value < min ? 0 : 100;
	}

	if (min > max) {
		let temp = min;
		min = max;
		max = temp;
	}

	const percent = ((value - min) / (max - min)) * 100;

	return Math.max(0, Math.min(100, percent));
}

// Computed Properties
const percent = computed(() => {
	return normalizePercent(props.value, normalizedMin.value, normalizedMax.value);
});

const meterColor = computed(() => {
	return props.color || 'var(--theme--primary)';
});

const tooltip = computed(() => {
	// Show the percentage on hover if indicator is not shown. Always show the label if it exists.
	let string = '';
	if (!props.indicator) {
		string += `${percent.value}%`;
	}
	if (props.label) {
		string += `${string ? ' - ' : ''}${props.label}`;
	}
	return string;
});

const normalizedMin = computed(() => (props.min > props.max ? props.max : props.min));
const normalizedMax = computed(() => (props.max < props.min ? props.min : props.max));
</script>

<style scoped>
meter {
	display: block;
	width: 100%;
	height: var(--theme--form--field--input--padding);
	appearance: none;
	background: none;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	color: var(--meter-color);
}

meter::-webkit-meter-inner-element {
	display: block;
	position: relative;
	background: none;
	background-color: transparent;
	border: none;
}

meter::-webkit-meter-bar {
	background: none;
	background-color: var(--theme--background-subdued);
	color: var(--meter-color);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
}

meter::-webkit-meter-optimum-value {
	border: none;
	background: none;
	background-color: currentColor;
}

.meter-container {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
}

.text {
	color: var(--theme--foreground);
	font-weight: var(--theme--form--field--label--font-weight);
}
</style>
