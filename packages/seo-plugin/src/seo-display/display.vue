<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
import { computed } from 'vue';
import SeoStatus from './SeoStatus.vue';

const props = defineProps<{
	value: SeoValue | Record<string, unknown>[];
	collection: string;
	interfaceOptions: SeoInterfaceOptions;
	field: string;
	showSearchPreview?: boolean;
}>();

// A column like `translations.seo` passes one row per language instead of a single value
const entries = computed(() => {
	if (!Array.isArray(props.value)) return [{ value: props.value, language: undefined }];

	const key = props.field.split('.').at(-1)!;

	return props.value
		.filter((row) => row?.[key])
		.map((row) => ({ value: row[key] as SeoValue, language: row.languages_code as string | undefined }));
});
</script>

<template>
	<div class="seo-display">
		<SeoStatus
			v-for="(entry, index) in entries"
			:key="entry.language ?? index"
			:value="entry.value"
			:language="entry.language"
			:collection="collection"
			:interface-options="interfaceOptions"
			:show-search-preview="showSearchPreview"
		/>
	</div>
</template>

<style scoped>
.seo-display {
	display: flex;
	gap: 4px;
}
</style>
