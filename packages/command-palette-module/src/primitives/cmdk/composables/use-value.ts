import { isArray } from "lodash-es";
import { computed, MaybeRef, ref, Ref, unref, VNode, watch } from "vue";
import { injectCommandRootContext } from "../components/command.vue";
import { VALUE_ATTR } from "../constants";
import { getTextContent } from "../utils/get-text-content";

export function useValue(
  id: string,
  elementRef: Ref<HTMLElement | null>,
  deps: (
    | MaybeRef<string>
    | Ref<HTMLElement | null>
    | Ref<VNode[]>
    | undefined
  )[],
  aliases?: MaybeRef<string[] | undefined>,
) {
  const internalValue = ref("");
  const context = injectCommandRootContext();

  const value = computed(() => {
    for (const part of deps) {
      const _part = unref<string | HTMLElement | VNode[] | null | undefined>(
        part,
      );

      const content = getTextContent(...(isArray(_part) ? _part : [_part]));

      if (content) return content;
    }

    return internalValue.value;
  });

  watch(
    value,
    (newValue) => {
      const keywords = (unref(aliases) ?? []).map((alias) => alias.trim());
      context.value(id, newValue, keywords);
      elementRef.value?.setAttribute(VALUE_ATTR, newValue);
      internalValue.value = newValue;
    },
    { immediate: true },
  );

  return value;
}
