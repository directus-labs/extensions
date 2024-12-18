<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Field } from '@directus/types';

interface Props {
	value: boolean | null;
	field: Field;
	label?: string;
	description?: string;
	iconOn?: string;
	iconOff?: string;
	colorOn?: string;
	colorOff?: string;
}

const props = withDefaults(defineProps<Props>(), {
	label: undefined,
	description: undefined,
	iconOn: 'check',
	iconOff: 'close',
	colorOn: 'var(--theme--primary)',
	colorOff: 'var(--theme--form--field--input--foreground-subdued)',
});

const emit = defineEmits<{
	(e: 'input', value: boolean | null): void;
}>();

const { t } = useI18n();

const label = computed(() => props.label || t('interfaces.boolean.label_default'));
const description = computed(() => props.description || props.field.meta?.note);

const switchStyles = computed(() => ({
	'--switch-color-on': props.colorOn ?? 'var(--theme--primary)',
	'--switch-color-off': props.colorOff ?? 'var(--theme--form--field--input--foreground-subdued)',
}));

const toggleSwitch = () => {
	emit('input', !props.value);
};
</script>

<template>
	<div class="switch-interface bordered" :style="switchStyles">
		<label class="switch-label">
			<div class="switch-content">
				<span class="label-text">{{ label }}</span>
				<p v-if="description" class="switch-description">{{ description }}</p>
			</div>
			<span class="switch-button" :class="{ 'is-active': value }">
				<input
					type="checkbox"
					:checked="value ?? false"
					@change="toggleSwitch"
					class="switch-input"
					:aria-checked="value ?? false"
					:aria-label="label"
                    role="switch"
					tabindex="0"
				/>
				<span class="switch-slider">
					<v-icon :name="value ? iconOn : iconOff" class="switch-icon" />
				</span>
			</span>
		</label>
	</div>
</template>


<style scoped lang="scss">
.switch-interface {
	--switch-width: 48px;
	--switch-height: 28px;
	--switch-padding: 4px;
}

.switch-interface.bordered {
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}
}

.switch-label {
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	width: 100%;
    padding: var(--theme--form--field--input--padding);
}

.switch-content {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	margin-right: 16px;
}

.switch-button {
	position: relative;
	width: var(--switch-width);
	height: var(--switch-height);
	border-radius: calc(var(--switch-height) / 2);
	background-color: var(--switch-color-off);
	transition: background-color 0.2s ease;
	padding: var(--switch-padding);
	flex-shrink: 0;
}

.switch-button.is-active {
	background-color: var(--switch-color-on);
}

.switch-input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.switch-slider {
	display: flex;
	align-items: center;
	justify-content: center;
	width: calc(var(--switch-height) - 2 * var(--switch-padding));
	height: calc(var(--switch-height) - 2 * var(--switch-padding));
	border-radius: 50%;
	background-color: var(--theme--background);
	transition: transform 0.2s ease;
	transform: translateX(v-bind('value ? `calc(var(--switch-width) - var(--switch-height))` : "0"'));
	padding: 4px;
}

.switch-icon {
	color: var(--switch-color-off);
	--v-icon-size: 16px;
}

.switch-button.is-active .switch-icon {
	color: var(--switch-color-on);
}

.label-text {
	font-family: var(--theme--fonts--sans--font-family);
	font-weight: var(--theme--fonts--sans--font-weight);
	color: var(--theme--foreground);
	font-size: 1rem;
	line-height: 1.2;
}

.switch-description {
	font-size: 1rem;
	color: var(--theme--foreground-subdued);
	margin-top: 4px;
	line-height: 1.2;
}

.switch-input:focus-visible + .switch-slider {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}
</style>
