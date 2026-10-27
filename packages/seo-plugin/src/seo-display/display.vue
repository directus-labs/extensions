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

// A column like `translations.seo` passes one entry per translation instead of a single value:
// rows (`{ seo: {...} }`) on Directus 11+, the SEO values themselves on 10.
// Entries without SEO data are kept (scored as missing) so gaps stay visible.
const values = computed<SeoValue[]>(() => {
	if (!Array.isArray(props.value)) return [props.value];

	const key = props.field.split('.').at(-1)!;
	return props.value.map((entry) => ((entry && key in entry ? entry[key] : entry) ?? {}) as SeoValue);
});
</script>

<template>
	<div class="seo-display">
		<SeoStatus
			v-for="(seo, index) in values"
			:key="index"
			:value="seo"
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
