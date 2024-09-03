import { useLocalStorage } from "@vueuse/core";
import { readonly } from "vue";
import { useSettings } from "../../composables/use-settings";

const recent = useLocalStorage<string[]>("command-palette:recent-commands", []);

export function useRecentCommands() {
  const { settings } = useSettings();

  function add(id: string) {
    const index = recent.value.indexOf(id);

    if (index !== -1) {
      recent.value.splice(index, 1);
    }

    recent.value.unshift(id);

    if (recent.value.length > (settings.value?.recentSearchLimit ?? 5)) {
      recent.value.pop();
    }
  }

  return {
    commands: readonly(recent),
    add,
  };
}
