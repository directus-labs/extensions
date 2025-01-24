import { useStores } from "@directus/extensions-sdk";

export function isAdminFromStores(stores: ReturnType<typeof useStores>) {
  const { useUserStore } = stores;
  const userStore = useUserStore();

  return (
    userStore.currentUser?.admin_access ??
    userStore.currentUser?.role?.admin_access ??
    false
  );
}