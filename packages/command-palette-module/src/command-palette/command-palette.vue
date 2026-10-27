<script setup lang="ts">
import { onClickOutside, useEventListener, useMutationObserver } from '@vueuse/core';
import { ListboxRoot } from 'reka-ui';
import { computed, nextTick, ref, watch } from 'vue';
import Overlay from './components/overlay.vue';
import { provideGlobalCommandContext } from './composables/use-global-command-state';
import RootCommands from './root-commands.vue';
import { CommandRouterView, createCommandRouter } from './router';
import { provideCommandRouter } from './router/router';

const OPTION = '[role="option"]';
const ENABLED_OPTION = `${OPTION}:not([data-disabled])`;

const active = defineModel<boolean>('active');

const commandPalette = ref<{
	$el: HTMLElement;
	highlightedElement: HTMLElement | null;
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
// end, and Alt+Arrow to the first item of the next or previous group. Reka re-reads and sorts its whole collection
// several times per highlight, so arrows are handled here from one read of the options.
useEventListener(commandPaletteElement, 'keydown', (e: KeyboardEvent) => {
	if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || !commandPalette.value) return;

	e.preventDefault();
	e.stopPropagation();

	const down = e.key === 'ArrowDown';
	const options = getOptions();
	const highlighted = commandPalette.value.highlightedElement;
	const index = highlighted ? options.indexOf(highlighted) : -1;
	const next = index === -1 ? (down ? 0 : options.length - 1) : index + (down ? 1 : -1);

	let target: HTMLElement | undefined;
	if (e.altKey) target = getGroupJumpTarget(options, highlighted, down) ?? options[next];
	else if (e.metaKey) target = down ? options.at(-1) : options[0];
	else target = options[(next + options.length) % options.length];
	if (target) highlight(target);
}, { capture: true });

// Set once the user moves the highlight. Until then it's ours, and items that arrive late can take it back to the top.
let userHighlighted = false;

useEventListener(commandPaletteElement, 'keydown', (e: KeyboardEvent) => {
	if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) userHighlighted = true;
}, { capture: true });

useEventListener(commandPaletteElement, 'pointermove', (e: PointerEvent) => {
	if (e.target instanceof Element && e.target.closest('[role="option"]')) userHighlighted = true;
});

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
	if (!isLoading) highlightFirstUnlessPicked();
});

// Some items arrive after the first render (async commands, results). Those can land above a fallback like Ask AI, so
// move an automatic highlight back to the top.
useMutationObserver(commandPaletteElement, (records) => {
	const changed = records.some(({ addedNodes, removedNodes }) =>
		Array.from(addedNodes).some(containsOption) || Array.from(removedNodes).some(containsOption));

	if (changed) highlightFirstUnlessPicked();
}, { childList: true, subtree: true });

function close() {
	active.value = false;
	clear();
	commandRouter.clear();
}

function clear() {
	context.search.value = '';
}

function getOptions() {
	return Array.from(commandPaletteElement.value?.querySelectorAll<HTMLElement>(ENABLED_OPTION) ?? []);
}

function containsOption(node: Node) {
	return node instanceof Element && (node.matches(OPTION) || node.querySelector(OPTION) !== null);
}

function getGroupJumpTarget(options: HTMLElement[], highlighted: HTMLElement | null, down: boolean) {
	const groupOf = (element: HTMLElement | null) => element?.closest('[role="group"]') ?? null;
	const current = groupOf(highlighted);
	if (!current) return;

	const index = options.indexOf(highlighted!);
	const candidates = down ? options.slice(index + 1) : options.slice(0, index).reverse();
	const group = candidates.map(groupOf).find((candidate) => candidate && candidate !== current);

	return group ? options.find((option) => groupOf(option) === group) : undefined;
}

function highlightFirstUnlessPicked() {
	if (!userHighlighted || !commandPalette.value?.highlightedElement?.isConnected) highlightFirst();
}

// Many changes can ask for this in one tick (opening, typing, results); highlight once, after they've rendered.
let highlightQueued = false;

function highlightFirst() {
	userHighlighted = false;
	if (highlightQueued) return;

	highlightQueued = true;

	nextTick(() => {
		highlightQueued = false;
		const first = commandPaletteElement.value?.querySelector<HTMLElement>(ENABLED_OPTION);
		if (first) highlight(first);
	});
}

function highlight(element: HTMLElement) {
	if (!commandPalette.value) return;

	commandPalette.value.highlightedElement = element;
	element.scrollIntoView({ block: 'nearest' });
	onHighlight(element);
}

// Keep a group's heading in view when keyboard navigation lands on its first item.
function onHighlight(element?: HTMLElement) {
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
			@highlight="onHighlight($event?.ref)"
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
