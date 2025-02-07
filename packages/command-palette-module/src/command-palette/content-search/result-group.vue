<script setup lang="ts">
import type { Ref } from 'vue';
import type { CollectionSearchResult } from '../../../types';
import { useCollection } from '@directus/extensions-sdk';
import { computed, unref } from 'vue';
import Highlights from '../../highlights.vue';
import Item from '../components/item.vue';

const props = defineProps<{
	query: Ref<string>;
	result: CollectionSearchResult;
}>();

const collection = computed(() => unref(props.result.collection));
const { info } = useCollection(collection);

const displayTemplate = computed(() => {
	return (
		props.result.displayTemplate
		?? info.value?.meta?.display_template
		?? '{{title}}'
	);
});
</script>

<template>
	<div class="result-group">
		<div class="collection">
			{{ result.collection }}
		</div>
		<Item
			v-for="(hit, _index) in result.hits"
			:key="`${result.collection}-${hit[result.primaryKeyField.field]}`"
			:icon="info.icon"
		>
			<template #title>
				<render-template
					:collection="info.collection"
					:item="hit"
					:template="displayTemplate"
				/>
			</template>
			<template #description>
				<Highlights
					v-if="hit[result.descriptionField]"
					:text="hit[result.descriptionField]"
					:query="query"
				/>
			</template>
		</Item>
	</div>
</template>

<style scoped lang="scss">
.collection {
	padding: 2px 12px;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.025rem;
	color: var(--theme--foreground-subdued);
}
</style>
