import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';

export function useIsAdmin() {
  const { useUserStore } = useStores();
  const userStore = useUserStore();

  return computed(() => userStore.currentUser?.role?.admin_access ?? userStore.currentUser?.admin_access ?? false);
}
