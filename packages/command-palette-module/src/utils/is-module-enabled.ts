import { useStores } from "@directus/extensions-sdk";
import { Settings } from "@directus/types";

export function isModuleEnabled(stores: ReturnType<typeof useStores>) {
  const { useSettingsStore } = stores;
  const settingsStore = useSettingsStore();
  return (settingsStore.settings as Settings).module_bar.find(
    (module) => module.type === "module" && module.id === "global-search",
  )?.enabled;
}
