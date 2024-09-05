<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toRefs,
  useSlots,
} from "vue";
import { useCommandMenu } from "../composables/use-command-menu";
import { useId } from "../composables/use-id";
import { useValue } from "../composables/use-value";
import { SELECT_EVENT } from "../constants";
import { injectCommandRootContext, injectState } from "./command.vue";
import { injectCommandGroupContext } from "./group.vue";

const props = defineProps<{
  value?: string;
  keywords?: string[];
  forceMount?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [value: string];
}>();

const { value: propValue, keywords } = toRefs(props);

const id = useId();
const currentRef = ref<HTMLDivElement | null>(null);

const slots = useSlots();
const defaultSlot = computed(() => slots.default());
const state = injectState();
const context = injectCommandRootContext();
const groupContext = injectCommandGroupContext(null);

const value = useValue(
  id,
  currentRef,
  [propValue, currentRef, defaultSlot],
  keywords,
);

const forceMount = computed(
  () => props.forceMount ?? groupContext?.forceMount.value,
);

const selected = useCommandMenu(
  (state) => !!state.value && state.value === value.value,
);

const render = useCommandMenu((state) =>
  forceMount.value
    ? true
    : context.filter.value === false
      ? true
      : !state.search
        ? true
        : state.filtered.items.get(id) > 0,
);

useEventListener(currentRef, SELECT_EVENT, onSelect);

function onSelect() {
  select();
  emit("select", value.value);
}

function select() {
  state.value = value.value;
}

let unregister: () => void | null = null;

onMounted(() => {
  if (!forceMount.value) {
    unregister = context.item(id, groupContext?.id);
  }
});

onBeforeUnmount(() => unregister?.());
</script>

<template>
  <div
    v-if="render"
    :id="id"
    ref="currentRef"
    cmdk-item
    role="option"
    :aria-disabled="String(disabled)"
    :aria-selected="String(selected)"
    :data-disabled="String(disabled)"
    :data-selected="String(selected)"
    :data-value="value"
    @pointermove="
      !disabled && !context.disablePointerSelection.value && select()
    "
    @click="!disabled && onSelect()"
  >
    <slot />
  </div>
</template>
