<script setup lang="ts">
import type { ComponentPublicInstance, Ref } from 'vue';
import {
	onKeyStroke,
	useCycleList,
	useEventListener,
	useTemplateRefsList,
} from '@vueuse/core';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

type MaybeHTML = HTMLElement | null | undefined;
type MaybeHTMLRef = Ref<MaybeHTML>;
interface MatrixButton {
	label: string;
	icon: string;
}

interface Props {
	value: string;
	target: 'above' | 'below';
	enableSearch?: boolean;
	searchPlaceholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
	target: 'below',
	enableSearch: false,
	searchPlaceholder: 'Search...',
});

const el = ref<HTMLElement>();

const { targetBuilder } = useNearestBuilderField(el, { onFound: () => removeParentDomElement(el) });
const { label, buttonMatrix, triggerClick } = useButtonMatrix(targetBuilder);

const searchQuery = ref('');

const filteredButtonMatrix = computed(() => {
	if (!searchQuery.value)
		return buttonMatrix.value;

	const query = searchQuery.value.toLowerCase();
	return buttonMatrix.value.filter((button) =>
		button.label.toLowerCase().includes(query),
	);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function useNearestBuilderField(el: MaybeHTMLRef, { onFound }: { onFound: Function }) {
	const targetBuilder: MaybeHTMLRef = ref();

	onMounted(() => {
		const targetSibling = props.target === 'above' ? 'previousElementSibling' : 'nextElementSibling';
		targetBuilder.value = el.value?.closest('.field')?.[targetSibling]?.querySelector('.m2a-builder');

		if (targetBuilder.value)
			onFound();
	});

	return { targetBuilder };
}

function removeParentDomElement(el: MaybeHTMLRef) {
	el.value?.closest('.field')?.remove();
}

function useButtonMatrix(targetBuilder: MaybeHTMLRef) {
	const label = ref('');
	const buttonMatrix = ref<MatrixButton[]>([]);
	// eslint-disable-next-line unused-imports/no-unused-vars
	let popupId = '';
	let firstActionButton: MaybeHTML;

	watch(() => targetBuilder.value, setup, { once: true });

	return { label, buttonMatrix, triggerClick };

	async function setup() {
		const firstAction: MaybeHTML = targetBuilder.value?.querySelector('.actions>.v-menu');
		firstActionButton = firstAction?.querySelector('.v-button button');
		if (!firstActionButton)
			return;

		label.value = firstActionButton.textContent ?? '';

		const maxTries = 20;
		let tryCount = 0;
		let popup;

		do {
			await delay(tryCount ? 50 : 0);
			tryCount++;

			firstActionButton.click();
			await nextTick();

			popup = findAndHandlePopup();
		}
		while (!popup && tryCount < maxTries);

		if (!popup)
			return;

		hideActionButton(firstAction!);
		createButtonMatrix(popup);
		hideAndClosePopup(popup);
	}

	function findAndHandlePopup() {
		const popup = document.querySelector('#menu-outlet .v-menu-popper.active:not([data-hacked])');
		if (!popup)
			return;

		(popup as HTMLElement).dataset.hacked = 'hacked';
		popupId = popup.id;

		return popup as HTMLElement;
	}

	function createButtonMatrix(popup: HTMLElement) {
		popup.querySelectorAll('.v-list-item.link.clickable')?.forEach((button) => {
			const label = (button as HTMLElement).textContent;
			const icon = (button.querySelector('.v-icon [data-icon]') as HTMLElement)?.dataset?.icon ?? 'database';

			buttonMatrix.value.push({ label, icon });
		});
	}

	function hideActionButton(button: HTMLElement) {
		button.style.visibility = 'hidden';
		button.style.display = 'block';
		button.style.position = 'absolute';
	}

	async function hideAndClosePopup(popup: HTMLElement) {
		popup.style.visibility = 'hidden';
		await delay(150);
		document.body.click();
	}

	async function triggerClick(index: number) {
		firstActionButton?.click();
		await nextTick();

		const popup = document.querySelector('.v-menu-popper.active');
		if (!popup)
			return;

		const items = popup?.querySelectorAll('.v-list-item.link.clickable');
		const targetItem = items?.[index] as HTMLElement;
		if (targetItem)
			targetItem.click();

		await nextTick();
		(popup as HTMLElement).style.visibility = 'hidden';
		document.body.click();
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// --- Keyboard Navigation with VueUse ---

const gridRef = ref<HTMLElement | null>(null);

const buttonRefs = useTemplateRefsList<ComponentPublicInstance>();

const buttonIndices = computed(() => filteredButtonMatrix.value.map((_, i) => i));

const { state: activeButtonIndex, next: cycleNext, prev: cyclePrev, goTo: goToIndex } = useCycleList(
	buttonIndices,
	{ initialValue: 0 },
);

function focusButton(index: number) {
	nextTick(() => {
		const targetComponent = buttonRefs.value[index];

		if (targetComponent?.$el) {
			const targetButtonWrapper = targetComponent.$el as HTMLElement;
			const innerButton = targetButtonWrapper?.querySelector('button');
			innerButton?.focus();
		}
	});
}

const keyStrokeOptions = { target: gridRef, passive: false };

onKeyStroke(['ArrowDown', 'ArrowRight'], (e) => {
	e.preventDefault();
	cycleNext();
	focusButton(activeButtonIndex.value);
}, keyStrokeOptions);

onKeyStroke(['ArrowUp', 'ArrowLeft'], (e) => {
	e.preventDefault();
	cyclePrev();
	focusButton(activeButtonIndex.value);
}, keyStrokeOptions);

onKeyStroke('Home', (e) => {
	e.preventDefault();
	goToIndex(0);
	focusButton(activeButtonIndex.value);
}, keyStrokeOptions);

onKeyStroke('End', (e) => {
	e.preventDefault();
	const lastIndex = buttonIndices.value.length - 1;

	if (lastIndex >= 0) {
		goToIndex(lastIndex);
		focusButton(activeButtonIndex.value);
	}
}, keyStrokeOptions);

watch(buttonIndices, (newIndices) => {
	if (!newIndices.includes(activeButtonIndex.value) && newIndices.length > 0) {
		goToIndex(0);
	}
	else if (newIndices.length === 0) {
		goToIndex(0);
	}
}, { flush: 'post' });

useEventListener(gridRef, 'focus', (event: FocusEvent) => {
	if (!gridRef.value?.contains(event.relatedTarget as Node) && buttonIndices.value.length > 0) {
		focusButton(activeButtonIndex.value);
	}
});
</script>

<template>
	<div ref="el">
		<v-notice
			v-if="!targetBuilder" type="warning"
			:icon="`vertical_align_${target === 'above' ? 'top' : 'bottom'}`"
		>
			No Builder (M2A) field found {{ target
			}} this field!
		</v-notice>
	</div>

	<Teleport v-if="!!targetBuilder" :to="targetBuilder">
		<div v-if="buttonMatrix.length > 0" class="btn-matrix">
			<v-divider v-if="label" inline-title class="label">
				{{ label }}
			</v-divider>

			<v-input
				v-if="props.enableSearch"
				v-model="searchQuery"
				:placeholder="props.searchPlaceholder"
				class="search-input"
			>
				<template #prepend>
					<v-icon name="search" />
				</template>
			</v-input>

			<div
				ref="gridRef"
				class="grid"
				tabindex="0"
			>
				<!-- eslint-disable-next-line vue/valid-v-for -->
				<v-button
					v-for="(button, index) in filteredButtonMatrix"
					:key="button.label"
					:ref="buttonRefs.set"
					:tabindex="index === activeButtonIndex ? 0 : -1"
					secondary
					full-width
					@click="triggerClick(index)"
					@keydown.enter.prevent="triggerClick(index)"
					@keydown.space.prevent="triggerClick(index)"
				>
					<v-icon :name="button.icon" />
					<v-text-overflow :text="button.label" />
				</v-button>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
:global(.m2a-builder:has(.btn-matrix) .actions) {
	margin-top: 0px;
}

:global(.m2a-builder:has(.btn-matrix) .actions:has(.v-menu + .v-menu)) {
	margin-top: 8px;
}

.btn-matrix {
	margin-top: 8px;
	container-type: inline-size;
}

.label {
	margin-bottom: 8px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
}

@container (width > 425px) {
	.grid {
		grid-template-columns: repeat(4, 1fr);
	}
}

@container (width > 600px) {
	.grid {
		grid-template-columns: repeat(5, 1fr);
	}
}

.v-button :deep(.content) {
	--v-icon-color: var(--theme--foreground-subdued);
	gap: 6px;

	flex-direction: column;
}

.v-button {
	--v-button-height: 100px;
}

.v-text-overflow {
	width: 100%;
}

.v-divider :deep(.type-text) {
	color: var(--theme--foreground-subdued);
}

.search-input {
	margin-bottom: 12px;
}

/* .grid > .v-button[tabindex='0'] {
	outline: var(--theme--border-width) solid var(--theme--form--field--input--border-color-focus);
	outline-offset: 2px;
}
.grid:focus {
	outline: none;
}
.grid > .v-button:focus {
	outline: none;
}
.grid > .v-button[tabindex='0'] button:focus-visible {
	outline: none;
} */
</style>
