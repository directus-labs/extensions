<script setup lang="ts">
import { useCollection } from '@directus/extensions-sdk';
import { Ref, unref, computed } from 'vue';
import { CollectionSearchResult } from '../../types';
import Highlights from '../highlights.vue';
import ResultItem from './result-item.vue';

const props = defineProps<{
  query: Ref<string>;
  result: CollectionSearchResult;
  activeIndex: number;
}>();

defineEmits<{
  select: [index: number];
  setActiveIndex: [index: number];
}>();

const collection = computed(() => unref(props.result.collection));
const { info, primaryKeyField } = useCollection(collection);

const displayTemplate = computed(() => {
  return props.result.displayTemplate ?? info.value?.meta?.display_template ?? '{{title}}';
});
</script>

<template>
  <div class="result-group">
    <div class="collection">{{ result.collection }}</div>
    <result-item
      v-for="(hit, index) in result.hits"
      :key="`${result.collection}-${hit[result.primaryKeyField.field]}`"
      :icon="info.icon"
      :active="activeIndex === index"
      @select="$emit('select', index)"
      @hover="$emit('setActiveIndex', index)">
      <template #title>
        <render-template :collection="info.collection" :item="hit" :template="result.displayTemplate" />
      </template>
      <template #description>
        <highlights v-if="hit[result.descriptionField]" :text="hit[result.descriptionField]" :query="query" />
      </template>
    </result-item>
  </div>
</template>

<style scoped lang="scss">
.collection {
  padding: 2px 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025rem;
  color: var(--theme--foreground-subdued);
}
</style>
