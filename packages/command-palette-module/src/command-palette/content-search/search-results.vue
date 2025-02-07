<script setup lang="ts">
import type { CollectionSearchResult, RecentSearchEntry } from '../../../types';
import { omit } from 'lodash-es';
import ResultGroup from './result-group.vue';

defineProps<{
	results: CollectionSearchResult[];
	totalResults: number;
	loading: boolean;
}>();

const emit = defineEmits<{
	open: [path: string, entry: RecentSearchEntry];
}>();

function onHitSelected(result: CollectionSearchResult, index: number) {
	const hit = result.hits[index];

	emit('open', `/content/${result.collection}/${hit[result.primaryKeyField]}`, {
		...omit(result, 'hits'),
		hit,
	});
}

// eslint-disable-next-line unused-imports/no-unused-vars
function onRecentSelected(entry: RecentSearchEntry) {
	emit(
		'open',
		`/content/${entry.collection}/${entry.hit[entry.primaryKeyField]}`,
		entry,
	);
}
</script>

<template>
	<v-list class="search-results-list">
		<template v-if="(query && results.length > 0) || loading">
			<!-- eslint-disable-next-line vue/valid-v-for -->
			<ResultGroup
				v-for="(result, index) in results"
				:query="query"
				:result="result"
				:active-index="activeIndex - offsets[index]"
				@set-active-index="activeIndex = $event + offsets[index]"
				@select="onHitSelected(result, $event)"
			/>
		</template>
	</v-list>
</template>

<style scoped lang="scss">
.search-results-list {
	max-height: min(350px, 50vh);
	overflow-y: auto;

	padding: 6px;
}
</style>
