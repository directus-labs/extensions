import { useStores } from "@directus/extensions-sdk";
import { get, isObject, mergeWith, set } from "lodash-es";
import {
  computed,
  ComputedRef,
  nextTick,
  readonly,
  ref,
  Ref,
  watch,
} from "vue";
import { evaluateFormula } from "../lib/evaluate-formula";
import { extractFieldsFromAst } from "../lib/extract-fields-from-ast";
import { parseFormula } from "../lib/parse-formula";
import { useItem } from "./use-item";

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

  const ast = computed(() => {
    parseError.value = null;

    try {
      return parseFormula(formula.value);
    } catch (err) {
      parseError.value = err;
    }
  });

  const result = ref<string | number | boolean | null>(null);
  const parseError = ref<unknown | string | null>(null);
  const evalError = ref<unknown>(null);

  const fields = computed(() => {
    if (!ast.value) return [];

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
    localValues: injectedValues,
  });

  watch(
    [fetchedItem, injectedValues],
    ([fetched, injected]) => {
      values.value = mergeWith(
        {},
        fetched,
        injected,
        (injectedVal, fetchedVal) => {
          if (isObject(injectedVal) && !isObject(fetchedVal)) {
            // If the value is an object, we want to keep the object as is, since then it is a queried object that
            // replaces the local primary key value.
            return injectedVal;
          }

          return undefined;
        },
      );
    },
    {
      deep: true,
      immediate: true,
    },
  );

  watch(
    [ast, values],
    () => {
      evalError.value = null;

      const valuesWithDefaults = {};

      for (const field of fields.value) {
        set(valuesWithDefaults, field, get(values.value, field, null));
      }

      try {
        result.value = evaluateFormula(ast.value, valuesWithDefaults);
      } catch (err) {
        evalError.value = err;
      }
    },
    { immediate: true, deep: true },
  );

  return {
    result: readonly(result),
    parseError,
    fetchError,
    evalError,
  };
}
