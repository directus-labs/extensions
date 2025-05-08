<script setup lang="ts">
import type { Ref } from 'vue';
import { inject, toRefs } from 'vue';
import { useSeoField } from '../../shared/composables/useSeoField';
import { seoRules } from '../../shared/rulesets';
import SeoFieldWrapper from './SeoFieldWrapper.vue';

const props = withDefaults(defineProps<{
	modelValue?: string;
	template?: string;
	disabled?: boolean;
}>(), {});

const emit = defineEmits(['update:modelValue']);
const values = inject('values') as Ref<Record<string, any>>;

const { modelValue } = toRefs(props);

const {
	isTouched,
	isTemplateUpdate,
	state,
	transform,
} = useSeoField(
	modelValue,
	seoRules.title,
	values,
);

function onInput(newVal: string | null) {
	if (!isTemplateUpdate.value) {
		isTouched.value = true;
	}

	emit('update:modelValue', newVal || '');
	isTemplateUpdate.value = false;
}
</script>

<template>
	<SeoFieldWrapper
		label="Page Title"
		:state="state"
		:rule="seoRules.title"
	>
		<v-input
			:model-value="modelValue"
			placeholder="Enter your SEO title"
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
		</v-input>
	</SeoFieldWrapper>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
}
.label {
	margin-bottom: 0.5rem;
}
.hint {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
}

.template-button {
	--v-icon-color: var(--theme--foreground);
}
</style>
