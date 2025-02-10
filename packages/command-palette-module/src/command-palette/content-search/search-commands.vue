<script setup lang="ts">
import { syncRefs } from '@vueuse/core';
import { useGlobalSearch } from '../../composables/use-global-search';
import { useCommandContext } from '../composables/use-global-command-state';

// eslint-disable-next-line unused-imports/no-unused-vars
const { query, results, loading, info, clear } = useGlobalSearch();

const context = useCommandContext();
syncRefs(loading, context.loading);
</script>

<template>
	<!-- eslint-disable-next-line vue/valid-v-for -->
	<SearchCollectionGroup
		v-for="(result, index) in results"
		:query="query"
		:result="result"
		:active-index="activeIndex - offsets[index]"
		@set-active-index="activeIndex = $event + offsets[index]"
		@select="onHitSelected(result, $event)"
	/>
</template>
