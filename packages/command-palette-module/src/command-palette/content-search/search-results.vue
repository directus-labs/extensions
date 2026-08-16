<script setup lang="ts">
import type { CollectionSearchResult } from '../../types';
import { useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed } from 'vue';
import Highlights from '../../components/highlights.vue';
import Group from '../components/group.vue';
import Item from '../components/item.vue';

const props = defineProps<{
	results: CollectionSearchResult[];
	query: string;
}>();

const emit = defineEmits<{
	select: [item: { collection: string; pk: string }];
}>();

const collectionsStore = useStores().useCollectionsStore();
const groups = computed(() =>
	props.results.map((result) => {
		const collection = collectionsStore.getCollection(result.collection);
		const icon = collection?.meta?.icon;

		return {
			...result,
			name: String(collection?.name ?? formatTitle(result.collection)),
			icon: typeof icon === 'string' ? icon : 'box',
			template: result.displayTemplate ?? collection?.meta?.display_template ?? `{{${result.primaryKeyField}}}`,
		};
	}),
);

function select(group: (typeof groups.value)[number], hit: Record<string, any>) {
	const pk = String(hit[group.primaryKeyField]);

	emit('select', {
		collection: group.collection,
		pk,
	});
}
</script>

<template>
	<Group
		v-for="group in groups"
		:key="group.collection"
		:heading="group.name"
		:icon="group.icon"
		force-mount
	>
		<Item
			v-for="hit in group.hits"
			:key="JSON.stringify([group.collection, hit[group.primaryKeyField]])"
			:value="JSON.stringify([group.collection, hit[group.primaryKeyField]])"
			:keywords="[query]"
			:icon="group.icon"
			force-mount
			@select="select(group, hit)"
		>
			<render-template :collection="group.collection" :item="hit" :template="group.template" />
			<template v-if="group.descriptionField && hit[group.descriptionField]" #description>
				<Highlights :text="String(hit[group.descriptionField])" :query="query" />
			</template>
		</Item>
	</Group>
</template>
