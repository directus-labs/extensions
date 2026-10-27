<script setup lang="ts">
import type { Ref } from 'vue';
import { inject, toRefs } from 'vue';
import { useSeoI18n } from '../../lang/use-seo-i18n';
import { useSeoField } from '../../shared/composables/useSeoField';
import { seoRules } from '../../shared/rulesets';
import { renderTemplate } from '../../shared/utils';
import SeoFieldWrapper from './SeoFieldWrapper.vue';

const props = defineProps<{
	modelValue: string;
	template?: string;
	disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const { t } = useSeoI18n();
const values = inject('values') as Ref<Record<string, any>>;

const { modelValue } = toRefs(props);

const { state } = useSeoField(modelValue, seoRules.meta_description);
</script>

<template>
	<SeoFieldWrapper
		:label="t('seo_plugin.ui.meta_description')"
		:state="state"
		:rule="seoRules.meta_description"
	>
		<v-textarea
			:model-value="modelValue"
			:disabled="disabled"
			:placeholder="t('seo_plugin.placeholders.enter_description')"
			@update:model-value="emit('update:modelValue', $event)"
		>
			<template v-if="template && !disabled" #append>
				<v-button
					v-tooltip="t('seo_plugin.interface.generate_from_template')"
					x-small
					secondary
					icon
					class="template-button"
					@click="emit('update:modelValue', renderTemplate(template, values))"
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
