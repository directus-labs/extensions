<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core';
import { computed, nextTick, ref, watch } from 'vue';
import { Command } from '../primitives/cmdk';
import { commandScore } from '../primitives/cmdk/utils/command-score';
import Overlay from './components/overlay.vue';
import { provideGlobalCommandContext } from './composables/use-global-command-state';
import RootCommands from './root-commands.vue';
import { CommandRouterView, createCommandRouter } from './router';
import { provideCommandRouter } from './router/router';

const active = defineModel<boolean>('active');

const commandPalette = ref<{
	$el: HTMLElement;
	selectFirstItem: () => void;
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

function close() {
	active.value = false;
	clear();
	commandRouter.clear();
}

function clear() {
	context.search.value = '';
}

function customFilter(value: string, search: string, keywords: string[]) {
	const root = commandPalette.value?.$el;
	const element = Array.from(
		root?.querySelectorAll<HTMLElement>('[data-value]') ?? [],
	).find((element) => element.dataset.value === value);

	if (!search) {
		const sort = element?.dataset.sort;
		return sort !== undefined ? 1 / (Number(sort) + 1) : 1 / Number.MAX_SAFE_INTEGER;
	}

	const score = commandScore(value, search, keywords);
	if (score <= 0.1) return 0;

	const priority = Number(element?.dataset.priority ?? 0) * 0.01;
	return score + priority;
}

function highlightFirst() {
	nextTick(() => commandPalette.value?.selectFirstItem());
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
		<Command
			ref="commandPalette"
			class="command-palette"
			label="Command Menu"
			:filter="customFilter"
			force-sort
		>
			<CommandRouterView />
		</Command>
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
