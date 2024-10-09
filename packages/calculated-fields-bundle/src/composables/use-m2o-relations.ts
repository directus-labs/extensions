import { useStores } from "@directus/extensions-sdk";
import { Relation } from "@directus/types";
import { computed, Ref, unref, watch } from "vue";
import {
  isRelationalFieldPath,
  RelationalFieldPath,
  splitFieldPath,
} from "../lib/field-helpers";
import { getAllM2ORelations } from "../lib/get-all-m2o-relations";

/**
 * Return a list of all M2O related fields for a given collection and fields.
 * If the fields are deeply nested (and are path of m2o relation) this includes all relations along the way,
 * e.g
 * - ['author.name'] will return ['author.name', [<author-relation>]]
 * - ['article.author.name'] will return ['article.author.name', [<article-relation>, <author-relation>]]
 */
export function useM2ORelations(
  collection: string | Ref<string | null>,
  fields: Ref<string[]>,
) {
  const { useRelationsStore } = useStores();
  const relationsStore = useRelationsStore();

  const relations = computed(() =>
    fields.value
      .filter((field) => isRelationalFieldPath(field))
      .map((field): [string, Relation[]] => [
        field,
        getAllM2ORelations(
          unref(collection)!,
          field as RelationalFieldPath,
          relationsStore,
        ),
      ])
      .filter(([_, relation]) => relation),
  );

  return relations;
}
