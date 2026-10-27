<script setup lang="ts">
import type { DescriptionDisplay } from '../types';
import { useCollection } from '@directus/extensions-sdk';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { hasDescriptionValue } from '../utils/get-description-display';
import { getItemRoute } from '../utils/get-item-route';
import { isItemRouteAvailable } from '../utils/is-item-route-available';
import DescriptionBoundary from './description-boundary.vue';
import Highlights from './highlights.vue';

const props = defineProps<{
	collection: string;
	query: string;
	displayTemplate: string;
	descriptionField?: string | null;
	descriptionDisplay?: DescriptionDisplay;
	hits: Record<string, any>[];
}>();

const router = useRouter();
const { info, primaryKeyField } = useCollection(props.collection);
const collectionInfo = computed(() => info.value);
const primaryKeyFieldName = computed(() => primaryKeyField.value?.field ?? 'id');

// A limit of -1 fetches every match. Render them a page at a time (the palette's per-collection cap), so a broad query
// doesn't draw hundreds of rows on each keystroke.
const PAGE_SIZE = 25;
const visibleCount = ref(PAGE_SIZE);
const rows = computed(() => props.hits.slice(0, visibleCount.value).map((hit) => ({
	hit,
	key: JSON.stringify([props.collection, hit[primaryKeyFieldName.value]]),
})));

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
		<DescriptionBoundary v-slot="{ failed }" :results="hits">
			<v-list-item
				v-for="{ hit, key } in rows"
				:key="key"
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
					<template v-if="descriptionField && hasDescriptionValue(hit[descriptionField])">
						<component
							:is="descriptionDisplay.component"
							v-if="descriptionDisplay && !failed.has(key)"
							v-bind="descriptionDisplay.props"
							:value="hit[descriptionField]"
							:data-description-key="key"
							class="hit-description"
						/>
						<Highlights
							v-else
							:text="String(hit[descriptionField])"
							:query="query"
							class="hit-description"
						/>
					</template>
				</div>
			</v-list-item>
		</DescriptionBoundary>
		<v-button
			v-if="hits.length > visibleCount"
			class="show-more"
			small
			secondary
			@click="visibleCount += PAGE_SIZE"
		>
			Show more ({{ hits.length - visibleCount }})
		</v-button>
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

.show-more {
	margin-top: 8px;
}
</style>
