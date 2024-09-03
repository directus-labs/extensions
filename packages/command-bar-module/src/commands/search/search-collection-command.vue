<script setup lang="ts">
import { useStores } from "@directus/extensions-sdk";
import formatTitle from "@directus/format-title";
import { syncRef } from "@vueuse/core";
import { computed, resolveComponent, toRefs } from "vue";
import { useRouter } from "vue-router";
import { Empty, List, useCommandContext } from "../../command-palette";
import CommandItem from "../../command-palette/components/command-item.vue";
import { useCollectionSearch } from "../../composables/use-collection-search";
import { getItemResultCommand } from "./utils/get-item-result-command";

const props = defineProps<{
  collection: string;
}>();

const { collection } = toRefs(props);

const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();
const router = useRouter();

const { search, loading, close } = useCommandContext();

const {
  results,
  info,
  loading: searchBusy,
} = useCollectionSearch(collection, search);

syncRef(loading, searchBusy);

const collectionName = computed(
  () =>
    collectionsStore.getCollection(collection.value)?.name ??
    formatTitle(collection.value),
);

const RenderTemplate = resolveComponent("render-template");
const DisplayImage = resolveComponent("display-image");

const resultCommands = computed(() =>
  results.value.map((item) =>
    getItemResultCommand(item, {
      info,
      DisplayImage,
      RenderTemplate,
    }),
  ),
);

function onSelect(index: number) {
  const item = results.value[index];

  router.push(
    `/content/${collection.value}/${item[info.value.primaryKeyField]}`,
  );

  close();
}
</script>

<template>
  <List :search-bar-placeholder="`Search ${collectionName}...`">
    <Empty v-if="search" />
    <CommandItem
      v-for="(command, index) in resultCommands"
      :key="command.id"
      :command="command"
      @select="onSelect(index)"
    />
  </List>
</template>
