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

// Helper Functions
function normalizePercent(value: number, min: number, max: number): number {
	if (min === max) {
		return value < min ? 0 : 100;
	}

	if (min > max) {
		const temp = min;
		min = max;
		max = temp;
	}

	const percent = (value - min) / (max - min) * 100;

	return Math.max(0, Math.min(100, percent));
}

const normalizedMin = computed(() => Math.min(props.min, props.max));
const normalizedMax = computed(() => Math.max(props.max, props.min));

// Computed Properties
const meterProgress = computed(() => {
	return normalizePercent(props.value, normalizedMin.value, normalizedMax.value);
});

const meterColor = computed(() => {
	return props.color || 'var(--theme--primary)';
});
</script>

<template>
	<div :style="{ '--meter-color': meterColor }">
		<template v-if="indicator">
			<div :style="{ width: `${meterProgress}%` }" class="indicator-container">
				<p class="text indicator">
					{{ meterProgress }}%
				</p>
			</div>
		</template>
		<div class="meter-container">
			<meter :value="value" :min="min" :max="max" />
		</div>
		<template v-if="label">
			<div class="label-container">
				<label class="text">{{ label }}</label>
			</div>
		</template>
	</div>
</template>

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
	gap: 8px;
}

.indicator-container {
	min-width: fit-content;
	text-align: end;
	margin-block-end: 8px;
}

.label-container {
	margin-block-start: 8px;
}

.text {
	color: var(--theme--foreground);
	font-weight: var(--theme--form--field--label--font-weight);
}
</style>
