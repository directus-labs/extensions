<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import type { RecentSearchEntry } from '../../types';
import Highlights from '../highlights.vue';
import ResultItem from './result-item.vue';

defineProps<{
  entry: RecentSearchEntry;
  active: boolean
}>();

defineEmits<{
  select: []
  setActive: []
}>();

</script>

<template>
  <result-item
    :key="`${entry.collection}-${entry.hit[entry.primaryKeyField.field]}`"
    icon="history"
    :active="active"
    @select="$emit('select')"
    @hover="$emit('setActive')">
    <template #title>
      <div class="title-wrapper">
        <render-template :collection="entry.collection" :item="entry.hit" :template="entry.displayTemplate" />
        <span class="collection">{{ formatTitle(entry.collection) }}</span>
      </div>
    </template>
    <template #description>
      <highlights v-if="entry.hit[entry.descriptionField]" :text="entry.hit[entry.descriptionField]" />
    </template>
  </result-item>
</template>

<style scoped lang="scss">
.title-wrapper {
  display: flex;
  justify-content: space-between;

  gap: 12px;
  overflow-x: hidden;
  text-overflow: ellipsis;

  .collection {
    font-size: 12px;
    color: var(--theme--foreground-subdued);
  }
}
</style>
