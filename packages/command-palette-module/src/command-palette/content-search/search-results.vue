<script setup lang="ts">
import type { CollectionSearchResult } from '../../types';
import { useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed } from 'vue';
import DescriptionBoundary from '../../components/description-boundary.vue';
import Highlights from '../../components/highlights.vue';
import { hasDescriptionValue } from '../../utils/get-description-display';
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
			rows: result.hits.map((hit) => ({ hit, key: JSON.stringify([result.collection, hit[result.primaryKeyField]]) })),
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
	<DescriptionBoundary v-slot="{ failed }" :results="results">
		<Group
			v-for="group in groups"
			:key="group.collection"
			:heading="group.name"
			:icon="group.icon"
		>
			<Item
				v-for="{ hit, key } in group.rows"
				:key="key"
				:value="key"
				:icon="group.icon"
				@select="select(group, hit)"
			>
				<render-template :collection="group.collection" :item="hit" :template="group.displayTemplate" />
				<template v-if="group.descriptionField && hasDescriptionValue(hit[group.descriptionField])" #description>
					<component
						:is="group.descriptionDisplay.component"
						v-if="group.descriptionDisplay && !failed.has(key)"
						v-bind="group.descriptionDisplay.props"
						:value="hit[group.descriptionField]"
						:data-description-key="key"
					/>
					<Highlights v-else :text="String(hit[group.descriptionField])" :query="query" />
				</template>
			</Item>
		</Group>
	</DescriptionBoundary>
</template>
