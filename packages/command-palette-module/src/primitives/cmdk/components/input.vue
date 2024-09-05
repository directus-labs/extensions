<script lang="ts" setup>
import { computed, watch } from "vue";
import { useCommandMenu } from "../composables/use-command-menu";
import { ITEM_SELECTOR, VALUE_ATTR } from "../constants";
import { useForwardExpose } from "../utils/use-forward-expose";
import { injectCommandRootContext, injectState } from "./command.vue";

const props = withDefaults(
  defineProps<{
    value?: string | null;
  }>(),
  {
    value: null,
  },
);

defineEmits<{
  change: [value: string | null];
}>();

const { forwardRef } = useForwardExpose();
const isControlled = computed(() => props.value !== null);
const search = useCommandMenu((state) => state.search);
const value = useCommandMenu((state) => state.value);
const state = injectState();
const context = injectCommandRootContext();

const selectedItemId = computed(() => {
  const item = context.listInnerRef.value?.querySelector(
    `${ITEM_SELECTOR}[${VALUE_ATTR}="${encodeURIComponent(value)}"]`,
  );

  return item?.getAttribute("id") ?? undefined;
});

watch(
  () => props.value,
  (value) => {
    if (value !== null) {
      state.search = value;
    }
  },
);
</script>

<template>
  <input
    :id="context.inputId"
    ref="forwardRef"
    cmdk-input
    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    aria-autocomplete="list"
    role="combobox"
    aria-expanded="true"
    :aria-controls="context.listId"
    :aria-labelledby="context.labelId"
    :aria-activedescendant="selectedItemId"
    type="text"
    :value="isControlled ? props.value : search"
    @input="
      (e) => {
        if (!isControlled) {
          state.search = e.target.value;
        }

        $emit('change', e.target.value);
      }
    "
  />
</template>
