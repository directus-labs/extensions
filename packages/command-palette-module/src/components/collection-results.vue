<script setup lang="ts">
import { useCollection } from '@directus/extensions-sdk';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getItemRoute } from '../utils/get-item-route';
import { isItemRouteAvailable } from '../utils/is-item-route-available';
import Highlights from './highlights.vue';

const props = defineProps<{
	collection: string;
	query: string;
	displayTemplate?: string | null;
	descriptionField?: string | null;
	hits: Record<string, any>[];
}>();

const router = useRouter();
const { info, primaryKeyField } = useCollection(props.collection);
const collectionInfo = computed(() => info.value);
const primaryKeyFieldName = computed(() => primaryKeyField.value?.field ?? 'id');
const displayTemplate = computed(() =>
	props.displayTemplate ?? collectionInfo.value?.meta?.display_template ?? `{{${primaryKeyFieldName.value}}}`,
);

function getHitRoute(hit: Record<string, any>) {
	const primaryKey = hit[primaryKeyFieldName.value];
	if (primaryKey === null || primaryKey === undefined) return;

	const singleton = collectionInfo.value?.meta?.singleton === true;
	const itemRoute = getItemRoute(
		props.collection,
		String(primaryKey),
		singleton ? { singleton: true } : undefined,
	);

	return isItemRouteAvailable(router, itemRoute) ? itemRoute : undefined;
}
</script>

<template>
	<v-detail :label="collectionInfo?.name" start-open>
		<v-list-item
			v-for="hit in hits"
			:key="JSON.stringify([collection, hit[primaryKeyFieldName]])"
			block
			clickable
			:query="query"
			:to="getHitRoute(hit)"
		>
			<v-icon :name="collectionInfo?.meta?.icon ?? 'box'" left />
			<div>
				<render-template
					:collection="collection"
					:item="hit"
					:template="displayTemplate"
				/>
				<Highlights
					v-if="descriptionField && hit[descriptionField]"
					:text="String(hit[descriptionField])"
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
