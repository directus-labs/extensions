<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core';
import { ListboxRoot } from 'reka-ui';
import { computed, nextTick, ref, watch } from 'vue';
import Overlay from './components/overlay.vue';
import { provideGlobalCommandContext } from './composables/use-global-command-state';
import RootCommands from './root-commands.vue';
import { CommandRouterView, createCommandRouter } from './router';
import { provideCommandRouter } from './router/router';

const active = defineModel<boolean>('active');

const commandPalette = ref<{
	$el: HTMLElement;
	highlightedElement: HTMLElement | null;
	getItems: () => { ref: HTMLElement; value: string }[];
	highlightItem: (value: string) => void;
	highlightFirstItem: () => void;
} | null>(null);
const commandPaletteElement = computed(() => commandPalette.value?.$el);
const search = ref('');

const commandRouter = createCommandRouter({
	root: RootCommands,
});

provideCommandRouter(commandRouter);

const context = provideGlobalCommandContext({
	search,
	loading: ref(false),
	router: commandRouter,
	close,
	clearSearch: clear,
});

useEventListener(commandPaletteElement, 'keydown', (e: KeyboardEvent) => {
	if (e.defaultPrevented)
		return;

	if (e.key === 'Backspace' && search.value === '' && commandRouter.pop()) e.preventDefault();
});

// Reka stops at the ends of the list and has no group jumps. Wrap around at the ends, let Cmd+Arrow jump to either
// end, and Alt+Arrow to the first item of the next or previous group.
useEventListener(commandPaletteElement, 'keydown', (e: KeyboardEvent) => {
	if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || !commandPalette.value) return;

	const down = e.key === 'ArrowDown';
	const items = commandPalette.value.getItems();
	const highlighted = commandPalette.value.highlightedElement;
	const [start, end] = down ? [items[0], items.at(-1)] : [items.at(-1), items[0]];

	let target: (typeof items)[number] | undefined;
	if (e.altKey) target = getGroupJumpTarget(items, highlighted, down);
	else if (e.metaKey) target = end;
	else if (highlighted === end?.ref) target = start;
	if (!target) return;

	e.preventDefault();
	e.stopPropagation();
	commandPalette.value.highlightItem(target.value);
}, { capture: true });

// Reka clears the highlight when the pointer leaves the list. Keep it, so Enter still picks the highlighted item.
useEventListener(commandPaletteElement, 'pointerleave', (e: PointerEvent) => {
	e.stopImmediatePropagation();
}, { capture: true });

// Ignore click events from the dialog and menu outlets
onClickOutside(commandPaletteElement, close, {
	ignore: ['#dialog-outlet', '#menu-outlet'],
});

watch(active, (isActive) => {
	if (isActive) {
		highlightFirst();
	}
	else {
		close();
	}
});

watch(search, highlightFirst);

watch(context.loading, (isLoading) => {
	if (!isLoading) highlightFirst();
});

// Reka registers items a tick after they mount, and some arrive later still (async commands, results).
watch(() => commandPalette.value?.getItems().length, (count) => {
	if (count && !commandPalette.value?.highlightedElement?.isConnected) highlightFirst();
});

function close() {
	active.value = false;
	clear();
	commandRouter.clear();
}

function clear() {
	context.search.value = '';
}

function getGroupJumpTarget<T extends { ref: HTMLElement }>(items: T[], highlighted: HTMLElement | null, down: boolean) {
	const groupOf = (element: HTMLElement | null) => element?.closest('[role="group"]') ?? null;
	const current = groupOf(highlighted);
	if (!current) return;

	const index = items.findIndex(({ ref }) => ref === highlighted);
	const candidates = down ? items.slice(index + 1) : items.slice(0, index).reverse();
	const group = candidates.map(({ ref }) => groupOf(ref)).find((candidate) => candidate && candidate !== current);

	return group ? items.find(({ ref }) => groupOf(ref) === group) : undefined;
}

function highlightFirst() {
	nextTick(() => commandPalette.value?.highlightFirstItem());
}

// Keep a group's heading in view when keyboard navigation lands on its first item.
function onHighlight(item?: { ref: HTMLElement }) {
	const element = item?.ref;
	if (!element || element.matches(':hover')) return;

	const group = element.closest('[role="group"]');
	if (group?.querySelector('[role="option"]') !== element) return;

	group.firstElementChild?.scrollIntoView({ block: 'nearest' });
	element.scrollIntoView({ block: 'nearest' });
}

watch(commandRouter.currentCommand, () => {
	highlightFirst();
	if (!commandPalette.value?.$el)
		return;

	commandPalette.value.$el.classList.add('pop');

	setTimeout(() => {
		if (!commandPalette.value?.$el)
			return;

		commandPalette.value.$el.classList.remove('pop');
	}, 200);
});
</script>

<template>
	<Overlay v-model:active="active">
		<ListboxRoot
			ref="commandPalette"
			class="command-palette"
			model-value=""
			highlight-on-hover
			@highlight="onHighlight"
		>
			<CommandRouterView />
		</ListboxRoot>
	</Overlay>
</template>

<style lang="scss" scoped>
.command-palette {
	position: relative;
	margin: 10vh auto auto;
	max-width: 35rem;
	background-color: var(--theme--background);
	border-radius: 0.5rem;
	box-shadow: var(--theme--shadow);
	padding: var(--theme--spacing);
}

.pop {
	animation: pop 200ms ease;
}

@keyframes pop {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(0.99);
	}

	100% {
		transform: scale(1);
	}
}
</style>
