import { useCollection, useApi, useStores } from "@directus/extensions-sdk";
import { getEndpoint } from "@directus/utils";
import { Field, Relation } from "@directus/types";
import { get, isObject, set } from "lodash-es";
import { computed, MaybeRef, ref, Ref, unref, watch } from "vue";
import { isRelationalFieldPath } from "../lib/field-helpers";
import { useM2ORelations } from "./use-m2o-relations";

export type UseItemOptions = {
  collection: string | Ref<string | null>;
  primaryKey: MaybeRef<string>;
  fields: Ref<string[]>;
  localValues: Ref<Record<string, any>>;
};

/**
 * Composable that takes care of fetching the fields in the item
 * @param collection
 * @param primaryKey
 * @param fields
 * @param localValues
 */
export function useItem({
  collection,
  primaryKey,
  fields,
  localValues,
}: UseItemOptions) {
  const { useFieldsStore } = useStores();
  const fieldsStore = useFieldsStore();
  const api = useApi();
  const { primaryKeyField } = useCollection(collection);
  const loading = ref(false);
  const error = ref<unknown>(null);
  const item = ref<Record<string, any> | null>(null);
  const m2oRelations = useM2ORelations(collection, fields);

  const localM2OValues = computed(() => {
    if (!localValues.value) return {};

    const values: Record<string, any> = {};

    for (const [field, _] of m2oRelations.value) {
      const [relationField] = field.split(".");
      values[relationField!] = localValues.value[relationField!];
    }

    return values;
  });

  watch([collection, primaryKey, fields, primaryKeyField], fetch, {
    immediate: true,
  });

  watch(localM2OValues, (newValues, oldValues) => {
    const toFetch: [[string, string], Relation][] = [];

    for (const [field, relations] of m2oRelations.value) {
      const fieldPath: string[] = [];

      // Walk the relations and combine them into paths, always comparing the new local value to the old local value,
      // if they differ we need to fetch the value starting from the currently constructed field path
      for (let i = 0; i < relations.length; ++i) {
        const relation = relations[i]!;

        fieldPath.push(relation.field);
        const path = fieldPath.join(".");

        const newValue = get(newValues, path);
        const oldValue = get(oldValues, path);

        if (newValue !== oldValue && !isObject(newValue)) {
          const remainingKey = field.slice(path.length + 1);

          toFetch.push([[path, remainingKey], relation]);
          break;
        }
      }
    }

    if (toFetch.length) {
      fetchRelated(toFetch);
    }
  });

  return {
    item,
    loading,
    error,
    fetch,
  };

  async function fetch() {
    if (unref(primaryKey) === "+") return;
    // No need to fetch if the fields are not relational, since then they are included in the local values
    if (fields.value.every((field) => !isRelationalFieldPath(field))) return;

    loading.value = true;

    try {
      item.value = (
        await api.get(
          `${getEndpoint(unref(collection)!)}/${unref(primaryKey)}`,
          {
            params: { fields: unref(fields) },
          },
        )
      ).data?.data;
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRelated(relations: [[string, string], Relation][]) {
    const results: [[string, string], Record<string, any>][] =
      await Promise.all(
        relations.map(async ([[relationKey, fieldKey], relation]) => {
          const collection = relation.related_collection!;

          const localFieldValue = get(localM2OValues.value, relationKey);
          let primaryKey: string | null = null;

          if (isObject(localFieldValue)) {
            const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
              collection,
            ) as Field | null;

            if (primaryKeyField)
              primaryKey =
                (localFieldValue as Record<string, any>)[
                  primaryKeyField.field
                ] ?? null;
          } else {
            primaryKey = localFieldValue;
          }

          if (!primaryKey) {
            return [[relationKey, fieldKey], {}];
          }

          return [
            [relationKey, fieldKey],
            (
              await api.get(`${getEndpoint(collection)}/${primaryKey}`, {
                params: { fields: [fieldKey] },
              })
            ).data?.data,
          ];
        }),
      );

    // Set the related values on the items
    for (const [[fieldKey, fieldPath], value] of results) {
      // The fieldKey is the path to the related item in the root item, e.g. 'article.author'
      // The fieldPath is the path on the related item to the actual value, e.g. 'parent.name'

      const fieldValue = get(value, fieldPath);

      if (fieldValue === undefined) {
        continue;
      }

      if (!item.value) {
        item.value = {};
      }

      if (!isObject(get(item.value, fieldKey))) {
        set(item.value, fieldKey, {});
      }

      set(get(item.value, fieldKey), fieldPath, fieldValue);
    }
  }
}
