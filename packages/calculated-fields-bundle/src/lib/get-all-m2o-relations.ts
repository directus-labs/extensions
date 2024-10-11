import { Relation } from "@directus/types";
import {
  isRelationalFieldPath,
  RelationalFieldPath,
  splitFieldPath,
} from "./field-helpers";

export function getAllM2ORelations(
  collection: string,
  field: RelationalFieldPath,
  relationsStore: any,
): Relation[] {
  const [fieldKey, remainingPath] = splitFieldPath(field);

  const relation = relationsStore.getRelationForField(
    collection,
    fieldKey,
  ) as Relation | null;

  if (relation && relation.collection === collection) {
    return [
      relation,
      ...(isRelationalFieldPath(remainingPath)
        ? getAllM2ORelations(
            relation.related_collection!,
            remainingPath,
            relationsStore,
          )
        : []),
    ];
  }

  return [];
}
