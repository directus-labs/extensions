import { MaybeRef, ref, Ref, unref, watch } from "vue";
import { useCollection, useSdk } from "@directus/extensions-sdk";
import { DirectusClient, readItem, RestClient } from "@directus/sdk";

export type UseItemOptions = {
  collection: string | Ref<string | null>;
  primaryKey: MaybeRef<string>;
  fields: Ref<string[]>;
};

export function useItem({ collection, primaryKey, fields }: UseItemOptions) {
  const { primaryKeyField } = useCollection(collection);
  const loading = ref(false);
  const error = ref<unknown>(null);
  const item = ref<Record<string, any> | null>(null);
  const sdk = useSdk() as DirectusClient<any> & RestClient<any>;

  watch([collection, primaryKey, fields, primaryKeyField], fetch, {
    immediate: true,
  });

  return {
    item,
    loading,
    error,
    fetch,
  };

  async function fetch() {
    if (unref(primaryKey) === "+") return;

    loading.value = true;

    try {
      item.value = await sdk.request(
        readItem(unref(collection)!, unref(primaryKey), {
          fields: unref(fields),
        }),
      );
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }
}
