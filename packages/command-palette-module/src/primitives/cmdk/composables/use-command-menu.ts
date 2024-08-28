import { computed, ComputedRef, DeepReadonly, readonly } from "vue";
import { CommandState, injectState } from "../components/command.vue";

export function useCommandMenu<T = any>(
  selector: (state: DeepReadonly<CommandState>) => T,
): ComputedRef<T> {
  const state = injectState();
  return computed(() => selector(readonly(state)));
}
