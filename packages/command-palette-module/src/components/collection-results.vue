<script setup lang="ts">
import type { Ref } from 'vue';
import { useCollection } from '@directus/extensions-sdk';
import { computed, unref } from 'vue';
import Highlights from './highlights.vue';

const props = defineProps<{
	collection: string;
	query: Ref<string>;
	displayTemplate: string;
	descriptionField: string;
	hits: any[];
	size: 'small' | 'medium' | 'large';
}>();

const { info, primaryKeyField } = useCollection(unref(props.collection));

const displayTemplate = computed(() => {
	return (
		props.displayTemplate ?? info.value?.meta?.display_template ?? '{{title}}'
	);
});
</script>

<template>
	<v-detail :label="info.name" start-open>
		<v-list-item
			v-for="hit in hits"
			:key="`${collection}-${hit[primaryKeyField.field]}`"
			block
			clickable
			:query="query"
			:title="hit.name"
			:to="`/content/${collection}/${hit[primaryKeyField.field]}`"
		>
			<v-icon :name="info.icon" left />
			<div>
				<render-template
					:collection="info.collection"
					:item="hit"
					:template="displayTemplate"
					:fields
				/>
				<Highlights
					v-if="hit[descriptionField]"
					:text="hit[descriptionField]"
					:query="query"
					class="hit-description"
				/>
			</div>
		</v-list-item>
	</v-detail>
</template>

<style scoped>
.hit-description {
	width: 100%;
	color: var(--theme--foreground-subdued);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 1;
}
</style>
