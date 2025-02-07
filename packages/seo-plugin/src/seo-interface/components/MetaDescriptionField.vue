<script setup lang="ts">
import { inject, ref, toRefs } from 'vue';
import { useSeoField } from '../../shared/composables/useSeoField';
import { seoRules } from '../../shared/rulesets';
import SeoFieldWrapper from './SeoFieldWrapper.vue';

const props = defineProps<{
	modelValue: string;
	template?: string;
	disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const values = inject('values');

const { modelValue } = toRefs(props);

const {
	isTouched,
	isTemplateUpdate,
	state,
	transform,
} = useSeoField(modelValue, seoRules.meta_description, values);

function onInput(newVal: string) {
	if (!isTemplateUpdate.value) {
		isTouched.value = true;
	}

	emit('update:modelValue', newVal);
	isTemplateUpdate.value = false;
}
</script>

<template>
	<SeoFieldWrapper
		label="Meta Description"
		:state="state"
		:rule="seoRules.meta_description"
	>
		<v-textarea
			:model-value="modelValue"
			placeholder="Enter your meta description"
			@update:model-value="onInput"
		>
			<template v-if="template && !disabled" #append>
				<v-button
					v-tooltip="'Generate from template'"
					x-small
					secondary
					icon
					class="template-button"
					@click="onInput(transform(template))"
				>
					<v-icon name="auto_fix_high" />
				</v-button>
			</template>
		</v-textarea>
	</SeoFieldWrapper>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
}
.label {
	font-weight: bold;
	margin-bottom: 0.5rem;
}
.hint {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
}

.textarea-wrapper {
	position: relative;
}

.template-button {
	position: absolute;
	z-index: 10;
	right: 8px;
	top: 8px;
}
</style>
