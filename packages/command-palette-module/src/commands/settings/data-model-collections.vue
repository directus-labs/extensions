<script setup lang="ts">
import type { Collection } from '@directus/types';
import { useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Empty, Item, List, useCommandContext } from '../../command-palette';
import { rankItems } from '../../command-palette/utils/rank-items';

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();
const router = useRouter();
const { search, close } = useCommandContext();

const collections = computed<{ id: string; name: string; icon: string }[]>(() =>
	collectionsStore.allCollections
		.filter(({ type }: Collection & { type?: string }) => type !== 'alias')
		.map(({ collection, meta }: Collection) => ({
			id: collection,
			name: formatTitle(collection),
			icon: (meta?.icon ?? 'box') as string,
		})),
);

const filteredCollections = computed(() =>
	rankItems(collections.value, search.value, (collection) => ({
		value: collection.name,
		keywords: [collection.id],
	})).map(({ item }) => item),
);

function goToDataModel(collection?: string) {
	router.push(collection ? `/settings/data-model/${collection}` : '/settings/data-model');
	close();
}
</script>

<template>
	<List search-bar-placeholder="Data Model...">
		<Item v-if="!search" value="$data-model" icon="arrow_forward" @select="goToDataModel()">
			Go to Data Model
		</Item>
		<Empty v-if="search && filteredCollections.length === 0" />
		<Item
			v-for="collection in filteredCollections"
			:key="collection.id"
			:value="collection.id"
			:icon="collection.icon"
			@select="goToDataModel(collection.id)"
		>
			{{ collection.name }}
		</Item>
	</List>
</template>
