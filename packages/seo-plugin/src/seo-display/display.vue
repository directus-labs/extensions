<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
import { computed } from 'vue';
import SeoStatus from './SeoStatus.vue';
import TranslationsStatus from './TranslationsStatus.vue';

const props = defineProps<{
	value: SeoValue | Record<string, unknown>[];
	collection: string;
	interfaceOptions: SeoInterfaceOptions;
	field: string;
	showSearchPreview?: boolean;
}>();

// A column like `translations.seo` passes one entry per translation: rows (`{ seo: {...} }`) or the
// SEO values themselves, depending on the Directus version. Entries without SEO data count as missing.
const translationValues = computed<SeoValue[] | null>(() => {
	if (!Array.isArray(props.value)) return null;

	const key = props.field.split('.').at(-1)!;
	return props.value.map((entry) => ((entry && key in entry ? entry[key] : entry) ?? {}) as SeoValue);
});
</script>

<template>
	<div class="seo-display">
		<TranslationsStatus v-if="translationValues" :values="translationValues" :interface-options="interfaceOptions" />
		<SeoStatus
			v-else
			:value="value as SeoValue"
			:collection="collection"
			:interface-options="interfaceOptions"
			:show-search-preview="showSearchPreview"
		/>
	</div>
</template>

<style scoped>
/* Inline so it fits core's one-line template renderer (e.g. inside the Translations display) */
.seo-display {
	display: inline-flex;
	vertical-align: middle;
}
</style>
