<script setup lang="ts">
import { syncRefs } from "@vueuse/core";
import { useGlobalSearch } from "../../composables/use-global-search";
import { useCommandContext } from "../composables/use-global-command-state";

const { query, results, loading, info, clear } = useGlobalSearch();

const context = useCommandContext();
syncRefs(loading, context.loading);
</script>

<template>
  <SearchCollectionGroup
    v-for="(result, index) in results"
    :query="query"
    :result="result"
    :active-index="activeIndex - offsets[index]"
    @set-active-index="activeIndex = $event + offsets[index]"
    @select="onHitSelected(result, $event)"
  />
</template>
