import { Collection as _Collection, PermissionsAction } from "@directus/types";
import type { TranslateResult } from "vue-i18n";

export type Collection = _Collection & {
  name: string | TranslateResult;
};

export function getPermittedCollections(
  stores: any,
  action: PermissionsAction,
): Collection[] {
  const { useCollectionsStore, usePermissionsStore } = stores;
  const collectionsStore = useCollectionsStore();
  const permissionsStore = usePermissionsStore();

  return collectionsStore.visibleCollections.filter(
    ({ collection }: Collection) =>
      permissionsStore.hasPermission(collection, action),
  );
}
