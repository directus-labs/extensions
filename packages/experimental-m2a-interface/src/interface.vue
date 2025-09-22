<script setup lang="ts">
import type { ComponentPublicInstance, Ref } from 'vue';
import {
	useTemplateRefsList,
} from '@vueuse/core';
import { RovingFocusGroup, RovingFocusItem } from 'reka-ui';
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

	let popupId = '';
	let firstActionButton: MaybeHTML;
	let clickTimestamp = 0;

	watch(() => targetBuilder.value, setup, { once: true });

	return { label, buttonMatrix, triggerClick };

	async function setup() {
		const firstAction: MaybeHTML = targetBuilder.value?.querySelector('.actions>.v-menu');
		firstActionButton = firstAction?.querySelector('.v-button button');
		if (!firstActionButton)
			return;

		label.value = firstActionButton.textContent ?? '';

		const maxTries = 30;
		let tryCount = 0;
		let popup;

		do {
			// Longer delay for first few tries to allow popup creation
			const delay_ms = tryCount === 0 ? 100 : (tryCount < 5 ? 75 : 50);
			await delay(delay_ms);

			tryCount++;

			clickTimestamp = Date.now(); // Record when we clicked
			firstActionButton.click();
			await nextTick();

			// Additional delay after click for popup to fully render
			await delay(25);

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
		const instanceId = `btn-matrix-${clickTimestamp}`;

		// Find all active popups that haven't been claimed
		const popups = document.querySelectorAll('#menu-outlet .v-menu-popper.active:not([data-hacked])');

		if (popups.length === 0) {
			return null;
		}

		// Pick the popup that appeared most recently (DOM order)
		for (let i = popups.length - 1; i >= 0; i--) {
			const popup = popups[i] as HTMLElement;
			const m2aItems = popup.querySelectorAll('.v-list-item.link.clickable');

			if (m2aItems.length > 0) {
				popup.dataset.hacked = instanceId;
				popup.dataset.instanceId = instanceId;
				popupId = popup.id;
				return popup;
			}
		}

		return null;
	}

	function createButtonMatrix(popup: HTMLElement) {
		const items = popup.querySelectorAll('.v-list-item.link.clickable');
		buttonMatrix.value = []; // Clear existing buttons

		items.forEach((button) => {
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
		const targetButton = filteredButtonMatrix.value[index];
		if (!targetButton) return;

		firstActionButton?.click();
		await nextTick();

		// Find the popup that belongs to this button matrix instance
		// First try to find by our stored popupId, then fallback to active popup
		let popup: HTMLElement | null = null;

		if (popupId) {
			// Escape the ID to handle IDs that start with numbers or contain special characters
			const escapedId = CSS.escape(popupId);
			popup = document.querySelector(`#${escapedId}`);
		}

		if (!popup || !popup.classList.contains('active')) {
			popup = document.querySelector('.v-menu-popper.active');
		}

		if (!popup) return;

		const items = popup?.querySelectorAll('.v-list-item.link.clickable');

		// Find the original index in the full button matrix
		const originalIndex = buttonMatrix.value.findIndex((button) =>
			button.label === targetButton.label && button.icon === targetButton.icon,
		);

		const targetItem = items?.[originalIndex] as HTMLElement;
		if (targetItem) targetItem.click();

		await nextTick();
		(popup as HTMLElement).style.visibility = 'hidden';
		document.body.click();
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// --- Keyboard Navigation with RovingFocusGroup ---
const gridRef = ref<HTMLElement | null>(null);
const buttonRefs = useTemplateRefsList<ComponentPublicInstance>();

function handleTabFromSearch(event: KeyboardEvent) {
	if (event.shiftKey) {
		// Don't handle Shift+Tab, let it go to previous element
		return;
	}

	// If there are no filtered results, let Tab continue to next focusable element
	if (filteredButtonMatrix.value.length === 0) {
		return;
	}

	// Only prevent default for forward Tab when there are buttons to focus
	event.preventDefault();

	if (buttonRefs.value.length > 0) {
		// Focus the first button directly since RovingFocusGroup doesn't expose focus method
		nextTick(() => {
			const firstButton = buttonRefs.value[0];

			if (firstButton?.$el) {
				firstButton.$el.focus();
			}
		});
	}
}

function clearSearch() {
	searchQuery.value = '';
}
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
				@keydown.tab="handleTabFromSearch"
			>
				<template #prepend>
					<v-icon name="search" />
				</template>
				<template #append>
					<template v-if="searchQuery">
						<v-icon
							name="close"
							:class="{ 'clear-icon': searchQuery }"
							clickable
							@click="searchQuery ? clearSearch() : undefined"
						/>
					</template>
				</template>
			</v-input>

			<RovingFocusGroup
				v-if="filteredButtonMatrix.length > 0"
				ref="gridRef"
				class="grid"
				orientation="horizontal"
			>
				<RovingFocusItem
					v-for="(button, index) in filteredButtonMatrix"
					:key="button.label"
					:ref="buttonRefs.set"
					as="button"
					class="roving-button"
					@click="triggerClick(index)"
				>
					<v-icon :name="button.icon" />
					<v-text-overflow :text="button.label" size="small" />
				</RovingFocusItem>
			</RovingFocusGroup>
			<div v-else-if="searchQuery" class="no-results">
				<v-icon name="search_off" class="no-results-icon" />
				<p class="no-results-text">
					No items match your search. Try adjusting your search terms.
				</p>
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

.v-button :deep(button:focus) {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}

.roving-button {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-background-color: var(--theme--background-normal);
	--v-button-background-color-hover: var(--theme--background-accent);
	--v-icon-color: var(--theme--foreground-subdued);

	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100px;
	padding: 12px;

	color: var(--v-button-color);
	font-weight: 600;
	font-size: 16px;
	line-height: 22px;
	text-decoration: none;
	background-color: var(--v-button-background-color);
	border: var(--theme--border-width) solid var(--v-button-background-color);
	border-radius: var(--theme--border-radius);
	cursor: pointer;
	transition: var(--fast) var(--transition);
	transition-property: background-color, border, color;
}

.roving-button:hover {
	color: var(--v-button-color-hover);
	background-color: var(--v-button-background-color-hover);
	border-color: var(--v-button-background-color-hover);
}

.roving-button:focus {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
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

.no-results {
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px;
	text-align: center;
	color: var(--theme--foreground-subdued);
}

.no-results-icon {
	--v-icon-color: var(--theme--foreground-subdued);
	margin-bottom: 12px;
	font-size: 48px;
}

.no-results-text {
	margin: 0;
	font-weight: 500;
	color: var(--theme--foreground);
}
</style>
