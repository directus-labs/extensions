<script setup lang="ts">
import type { Ref } from 'vue';
import { inject, toRefs } from 'vue';
import { useSeoI18n } from '../../lang/use-seo-i18n';
import { useSeoField } from '../../shared/composables/useSeoField';
import { seoRules } from '../../shared/rulesets';
import SeoFieldWrapper from './SeoFieldWrapper.vue';

const props = withDefaults(defineProps<{
	modelValue?: string;
	template?: string;
	disabled?: boolean;
}>(), {});

const emit = defineEmits(['update:modelValue']);
const { t } = useSeoI18n();
const values = inject('values') as Ref<Record<string, any>>;

const { modelValue } = toRefs(props);

const {
	state,
	transform,
} = useSeoField(
	modelValue,
	seoRules.title,
	values,
);

function onInput(newVal: string | null) {
	emit('update:modelValue', newVal || '');
}
</script>

<template>
	<SeoFieldWrapper
		:label="t('seo_plugin.ui.page_title')"
		:state="state"
		:rule="seoRules.title"
	>
		<v-input
			:model-value="modelValue"
			:disabled="disabled"
			:placeholder="t('seo_plugin.placeholders.enter_title')"
			@update:model-value="onInput"
		>
			<template v-if="template && !disabled" #append>
				<v-button
					v-tooltip="t('seo_plugin.interface.generate_from_template')"
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
