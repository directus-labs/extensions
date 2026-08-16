<script setup lang="ts">
import type { Collection } from '@directus/types';
import { useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Empty, Item, List, useCommandContext } from '../../command-palette';

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();
const router = useRouter();
const { search, close } = useCommandContext();

const collections = computed(() =>
	collectionsStore.allCollections
		.filter(({ type }: Collection & { type?: string }) => type !== 'alias')
		.map(({ collection, meta }: Collection) => ({
			id: collection,
			name: formatTitle(collection),
			icon: (meta?.icon ?? 'box') as string,
		})),
);

function goToDataModel(collection?: string) {
	router.push(collection ? `/settings/data-model/${collection}` : '/settings/data-model');
	close();
}
</script>

<template>
	<List search-bar-placeholder="Data Model...">
		<Item v-if="!search" value="Data Model" icon="arrow_forward" @select="goToDataModel()">
			Go to Data Model
		</Item>
		<Empty />
		<Item
			v-for="collection in collections"
			:key="collection.id"
			:value="collection.name"
			:keywords="[collection.id]"
			:icon="collection.icon"
			@select="goToDataModel(collection.id)"
		>
			{{ collection.name }}
		</Item>
	</List>
</template>
