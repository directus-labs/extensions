<script lang="ts" setup>
import { inject, toRefs } from "vue";
import { useCalculatedFormula } from "../composables/use-calculated-formula";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  primaryKey: string;
  collection: string;
  formula: string;
  iconLeft?: string;
  iconRight?: string;
}>();

const { formula, collection, primaryKey } = toRefs(props);

const values = inject<Record<string, any>>("values");

const { result, error } = useCalculatedFormula({
  formula,
  collection,
  primaryKey,
  injectedValues: values,
});
</script>

<template>
  <v-notice v-if="!props.formula" type="warning">
    No formula provided.
  </v-notice>
  <v-notice v-else-if="error" type="danger"> {{ error }} </v-notice>
  <v-input v-else :model-value="result" readonly>
    <template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
    <template v-if="iconRight" #append><v-icon :name="iconRight" /></template>
  </v-input>
</template>
