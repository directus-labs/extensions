<script lang="ts" setup>
import { useStores } from "@directus/extensions-sdk";
import { computed, toRefs } from "vue";
import { useCalculatedFormula } from "../composables/use-calculated-formula";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  collection: string;
  field: string;
  primaryKey: string;
  formula: string;
}>();

const { useFieldsStore } = useStores();
const fieldsStore = useFieldsStore();

const fieldInfo = computed(() =>
  fieldsStore.getField(props.collection, props.field),
);

const formula = computed(
  () => props.formula ?? fieldInfo.value?.meta?.options?.formula,
);

const { result } = useCalculatedFormula({
  formula,
  collection,
  primaryKey,
  edits: {},
});
</script>

<template>
  <div>{{ result }}</div>
</template>
