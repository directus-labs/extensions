<script lang="ts">
import type { computed, onBeforeUnmount, onMounted, Ref,	ref, toRefs, useSlots } from 'vue';
import { createContext } from '../utils/create-context';
import { injectCommandRootContext } from './command.vue';

export interface CommandGroupContext {
	id: string;
	forceMount: Ref<boolean>;
}

export const [injectCommandGroupContext, provideCommandGroupContext]
  = createContext<CommandGroupContext>('CommandGroup');
</script>

<script setup lang="ts">
import { useCommandMenu } from '../composables/use-command-menu';
import { useId } from '../composables/use-id';
import { useValue } from '../composables/use-value';

const props = withDefaults(
	defineProps<{
		value?: string;
		forceMount?: boolean;
	}>(),
	{
		forceMount: false,
	},
);

const { forceMount, value } = toRefs(props);

const id = useId();
const currentRef = ref<HTMLDivElement | null>(null);
const headingRef = ref<HTMLDivElement | null>(null);
const headingId = useId();
const context = injectCommandRootContext();

const render = useCommandMenu((state) =>
	forceMount.value
		? true
		: context.filter.value === false
			? true
			: !state.search
					? true
					: state.filtered.groups.has(id),
);

provideCommandGroupContext({
	id,
	forceMount,
});

let unregister: () => void;

onMounted(() => {
	unregister = context.group(id);
});

onBeforeUnmount(() => unregister?.());

const slots = useSlots();
const defaultSlot = computed(() => slots.default());
useValue(id, currentRef, [value, headingRef, defaultSlot]);
</script>

<template>
	<div
		:id="id"
		ref="currentRef"
		cmdk-group
		role="presentation"
		:hidden="render ? undefined : true"
	>
		<div
			v-if="$slots.heading"
			:id="headingId"
			ref="headingRef"
			cmdk-group-heading
			aria-hidden
		>
			<slot name="heading" />
		</div>
		<div
			cmdk-group-items
			role="group"
			:aria-labelledby="$slots.heading ? headingId : undefined"
		>
			<slot />
		</div>
	</div>
</template>
