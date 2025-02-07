<script setup lang="ts">
import { computed } from 'vue';

export interface Step {
	text: string;
	value: string | number | boolean;
	icon?: string | null;
}

const props = withDefaults(
	defineProps<{
		value: string | number | boolean | null;
		choices: Step[];
		disabled?: boolean;
	}>(),
	{
		value: null,
		// eslint-disable-next-line vue/require-valid-default-prop
		choices: [],
	},
);

const emit = defineEmits(['input']);

const currentStepIdx = computed(() =>
	props.choices.findIndex((step) => step.value === props.value),
);

function handleChange(value: string | number | boolean): void {
	if (!props.disabled) {
		emit('input', value);
	}
}
</script>

<template>
	<div class="steps-wrapper">
		<div class="steps-container">
			<template v-for="(step, index) in choices" :key="step.value">
				<div class="step-wrapper">
					<button
						v-tooltip="step.text"
						class="step"
						:class="{ active: step.value === value, completed: currentStepIdx > index }"
						:disabled="disabled"
						@click="handleChange(step.value)"
					>
						<div class="step-icon">
							<VIcon v-if="step.icon" :name="step.icon" />
							<span v-else>{{ index + 1 }}</span>
						</div>
						<div class="step-text">
							{{ step.text }}
						</div>
					</button>
					<div v-if="index < choices.length - 1" class="connecting-bar-wrapper">
						<div
							class="connecting-bar"
							:class="{ completed: currentStepIdx > index }"
						/>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>

  <style scoped>
  .steps-wrapper {
	position: relative;
	overflow: hidden;
}

.steps-container {
	display: flex;
	align-items: start;
	justify-content: space-around;
	overflow-x: auto;
	scrollbar-width: none; /* Firefox */
	padding: var(--theme--form--field--input--padding);
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
}

.steps-container::-webkit-scrollbar {
	display: none; /* WebKit */
}

.step-wrapper {
	display: flex;
	width: 100%;
	flex-direction: column;
	align-items: center;
	position: relative;
}

.step {
	display: flex;
	flex-direction: column;
	align-items: center;
	cursor: pointer;
	margin: 0;
	border: none;
	background: none;
	padding: 0 10px;
	outline: none;
}

.step:hover .step-icon {
	border-color: var(--theme--primary);
	color: var(--theme--primary);
}

.step:hover .step-text {
	color: var(--theme--primary);
}

.step.completed:hover .step-icon {
	background: color-mix(in srgb, var(--theme--primary), var(--theme--background) 20%);
}

.connecting-bar-wrapper {
	position: absolute;
	top: 20px;
	left: 50%;
	width: 100%;
	height: 3px;
}

.connecting-bar {
	transition: background-color 0.2s;
	width: 100%;
	height: 3px;
	background-color: var(--theme--border-color);
}

.connecting-bar.completed {
	background-color: var(--theme--primary);
}

.step-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background-color: var(--theme--background);
	color: var(--theme--border-color);
	border: 2px solid var(--theme--border-color);
	font-size: 16px;
	font-weight: bold;
	z-index: 1;
}

.step-text {
	color: var(--theme--border-color);
	margin-top: 5px;
	text-align: center;
	font-size: 14px;
	line-height: 16px;
	overflow: hidden;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.step.active .step-text {
	color: var(--theme--primary);
	font-weight: 600;
}

.step.completed .step-text {
	color: var(--theme--foreground);
}

.step.active .step-icon {
	background-color: var(--theme--background);
	color: var(--theme--primary);
	border: 2px solid var(--theme--primary);
}

.step.completed .step-icon {
	background-color: var(--theme--primary);
	color: var(--theme--background);
	border-color: transparent;
}

button:disabled {
	cursor: not-allowed;
}
</style>
