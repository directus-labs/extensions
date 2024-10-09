<script lang="ts">
export default {
  inheritAttrs: false
}
</script>

<script setup lang="ts">

import { useCollection, useSync } from "@directus/extensions-sdk";
import { computed, toRefs } from 'vue';

const emit = defineEmits(['update:template', 'update:startDateField', 'update:endDateField', 'update:labelField', 'update:dependenciesField']);

const props = withDefaults(
	defineProps<{
    collection: string;
    labelField?: string;
    startDateField?: string;
    endDateField?: string;
    dependenciesField?: string;
	}>(),
	{
    
	}
);

const { collection: collectionKey } = toRefs(props);
const collection = useCollection(collectionKey);

const dateFields = computed(() => collection.fields.value.filter(f => ['timestamp', 'dateTime', 'date'].includes(f.type)));
const relationFields = computed(() => collection.fields.value.filter(f => ['m2o'].includes(f.field)));
const stringFields = computed(() => collection.fields.value.filter(f => ['string', 'text'].includes(f.type)));

const labelFieldWritable = useSync(props, 'labelField', emit);
const startDateFieldWritable = useSync(props, 'startDateField', emit);
const endDateFieldWritable = useSync(props, 'endDateField', emit);
const dependenciesFieldWritable = useSync(props, 'dependenciesField', emit);

</script>

<template>

  <div class="field">
    <div class="type-label">{{ "Label Field" }}</div>
    <v-select
      v-model="labelFieldWritable"
      :items="stringFields"
      show-deselect
      item-text="name"
      item-value="field"
    />
  </div>
  <div class="field">
    <div class="type-label">{{ "Start Date Field" }}</div>
    <v-select
      v-model="startDateFieldWritable"
      :items="dateFields"
      show-deselect
      item-text="name"
      item-value="field"
    />
  </div>
  <div class="field">
    <div class="type-label">{{ "End Date Field" }}</div>
    <v-select
      v-model="endDateFieldWritable"
      :items="dateFields"
      show-deselect
      item-text="name"
      item-value="field"
    />
  </div>
  <div class="field">
    <div class="type-label">{{ "Dependency Field" }}</div>
    <v-select
      v-model="dependenciesFieldWritable"
      :items="relationFields"
      show-deselect
      item-text="name"
      item-value="field"
    />
  </div>

</template>