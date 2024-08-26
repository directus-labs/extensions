import { has, isEqual, isObject, mergeWith } from "lodash-es";
import { computed, ComputedRef, readonly, ref, Ref, watch } from "vue";
import { evaluateFormula } from "../lib/evaluate-formula";
import { extractFieldsFromAst } from "../lib/extract-fields-from-ast";
import { parse } from "../lib/parser";
import { useItem } from "./use-item";
import { useStores } from "@directus/extensions-sdk";

type UseCalculatedFormulaOptions = {
  formula: Ref<string>;
  collection: Ref<string>;
  primaryKey: Ref<string>;
  injectedValues: ComputedRef<Record<string, any>>;
};

export function useCalculatedFormula({
  formula,
  collection,
  primaryKey,
  injectedValues,
}: UseCalculatedFormulaOptions) {
  const { useRelationsStore } = useStores();
  const relationsStore = useRelationsStore();

  const ast = computed(() => parse(formula.value));
  const result = ref<string | number | boolean | null>(null);
  const parseError = ref<unknown>(null);
  const evalError = ref<unknown>(null);

  const fields = computed(() => {
    parseError.value = null;

    try {
      return [...extractFieldsFromAst(ast.value)];
    } catch (err) {
      parseError.value = err;
    }

    return [];
  });

  const values = ref<Record<string, any>>({});

  const {
    item: fetchedItem,
    fetch: refetchItem,
    error: fetchError,
  } = useItem({
    collection,
    primaryKey,
    fields,
  });

  watch(
    [fetchedItem, injectedValues],
    ([item, injected]) => {
      values.value = mergeWith({}, item, injected, (injected, item) => {
        if (isObject(injected) && !isObject(item)) {
          // If the value is an object, we want to keep the object as is, since then it is a queried object that
          // replaces the local primary key value.
          return injected;
        }
      });
    },
    {
      immediate: true,
    },
  );

  watch([injectedValues], () => {
    for (const field of fields.value) {
      if (field.includes(".")) {
      }
    }
  });

  watch(
    [ast, values],
    () => {
      evalError.value = null;

      try {
        result.value = evaluateFormula(ast.value, values.value);
      } catch (err) {
        evalError.value = err;
      }
    },
    { immediate: true, deep: true },
  );

  return {
    result: readonly(result),
    error: computed(
      () => fetchError.value ?? parseError.value ?? evalError.value,
    ),
  };
}
