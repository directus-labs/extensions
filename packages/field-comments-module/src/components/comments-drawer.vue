<script setup lang="ts">
  import { useEventListener } from "@vueuse/core";
  import { useStores } from "@directus/extensions-sdk";
  import { ref } from "vue";
  import { OPEN_COMMENTS } from "../constants";
  import CommentsFeed from "./comments-feed.vue";

  const { usePermissionsStore } = useStores();
  const { hasPermission } = usePermissionsStore();
  const permission = hasPermission('directus_comments', 'read');

  const active = ref<boolean>(false);
  const collection_name = ref<string|null>(null);
  const field_id = ref<number|null>(null);
  const item_id = ref<string|number|null>(null);

  // @ts-ignore
  useEventListener(OPEN_COMMENTS, (e: Record<string,any>) => {
    collection_name.value = e.detail.collection_name;
    field_id.value = e.detail.field_id;
    item_id.value = e.detail.item_id;
    active.value = true;
  });

  function toggle() {
    active.value = !active.value;
  }
</script>

<template>
  <v-drawer
		v-model="active"
		title="Comments"
		icon="chat-bubble-outline"
		persistent
		@cancel="toggle"
	>
    <template #title>
			<h1 class="type-title">Comments</h1>
		</template>

    <div class="drawer-item-content">
      <v-info v-if="!permission" icon="block" title="Unauthorized Access" type="danger">You do not have permission to access comments</v-info>
      <CommentsFeed v-else-if="collection_name && field_id && item_id" :collection="collection_name" :field="field_id" :primary-key="item_id" />
      <v-info v-else type="danger" icon="error" :center="true" title="Missing Details"></v-info>
    </div>
  </v-drawer>
</template>
<style scoped>
  .drawer-item-content {
    background-color: var(--theme--sidebar--background);
    min-height: 100%;
    padding: 24px 32px 32px;
    margin-top: -24px;
  }
</style>