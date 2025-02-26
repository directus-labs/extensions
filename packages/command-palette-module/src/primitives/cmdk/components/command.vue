<!-- eslint-disable vue/prop-name-casing -->
<script lang="ts">
import type { computed, ComputedRef, nextTick, reactive, Ref, ref, watch, watchEffect } from 'vue';
import { createContext } from '../utils/create-context';

export interface CommandEmits {
	'update:modelValue': [value: string];
	'update:open': [value: boolean];
	'update:search': [value: string];
}

export interface CommandProps {
	'modelValue'?: string;
	'modelValue:search'?: string;
	'label'?: string;
	'aria-label'?: string;
	'shouldFilter'?: boolean;
	'forceSort'?: boolean;
	'disabledPointerSelection'?: boolean;
	'loop'?: boolean;
	'vimBindings'?: boolean;
	'filter': (value: string, search: string, keywords: string[]) => number;
}

export interface CommandRootContext {
	value: (id: string, value: string, keywords?: string[]) => void;
	item: (id: string, groupId?: string) => () => void;
	group: (id: string) => () => void;
	filter: ComputedRef<boolean>;
	label: ComputedRef<string>;
	disablePointerSelection: ComputedRef<boolean>;
	// Ids
	listId: string;
	labelId: string;
	inputId: string;
	// Refs
	listInnerRef: Ref<HTMLDivElement | null>;
}

export const [injectCommandRootContext, provideCommandRootContext] =
  createContext<CommandRootContext>('CommandRoot');

export interface CommandState {
	search: string;
	value: string | undefined;
	filtered: {
		count: number;
		items: Map<string, number>;
		groups: Set<string>;
	};
}

export const [injectState, provideState] =
  createContext<CommandState>('CommandState');
</script>

<script setup lang="ts">
import { useId } from '../composables/use-id';
import {
	GROUP_HEADING_SELECTOR,
	GROUP_ITEMS_SELECTOR,
	GROUP_SELECTOR,
	ITEM_SELECTOR,
	SELECT_EVENT,
	VALID_ITEM_SELECTOR,
	VALUE_ATTR,
} from '../constants';
import { commandScore } from '../utils/command-score';
import { findNextSibling, findPreviousSibling } from '../utils/find-sibling';

const props = withDefaults(defineProps<CommandProps>(), {
	shouldFilter: true,
	disabledPointerSelection: false,
});

defineEmits<CommandEmits>();

const value = defineModel<string>();
// eslint-disable-next-line unused-imports/no-unused-vars
const open = defineModel<boolean>('open');
const search = defineModel<string>('search', { default: '' });

const defaultFilter: CommandProps['filter'] = (value, search, keywords) =>
	commandScore(value, search, keywords);

const state = provideState(
	reactive({
		search: search.value,
		value: value.value,
		filtered: {
			count: 0,
			items: new Map(),
			groups: new Set(),
		},
	}),
);

watchEffect(() => {
	state.search = search.value;
	state.value = value.value;
});

const allItems = ref<Set<string>>(new Set());
const allGroups = ref<Map<string, Set<string>>>(new Map());
const ids = ref<Map<string, { value: string; keywords?: string[] }>>(new Map());

const listId = useId();
const labelId = useId();
const inputId = useId();
const listInnerRef = ref<HTMLDivElement | null>(null);

const context = provideCommandRootContext({
	value(id, value, keywords) {
		if (value !== ids.value.get(id)?.value) {
			ids.value.set(id, { value, keywords });
			state.filtered.items.set(id, score(value, keywords));
		}
	},
	// Track item lifecycle (mount, unmount)
	item(id, groupId) {
		allItems.value.add(id);

		// Track this item within the group
		if (groupId) {
			if (!allGroups.value.has(groupId)) {
				allGroups.value.set(groupId, new Set([id]));
			}
			else {
				allGroups.value.get(groupId)!.add(id);
			}
		}

		return () => {
			ids.value.delete(id);
			allItems.value.delete(id);
			state.filtered.items.delete(id);
			const selectedItem = getSelectedItem();

			// If the removed it is the current selection, reset value
			if (!selectedItem || selectedItem.getAttribute('id') === id) {
				state.value = '';
			}
		};
	},
	// Track group lifecycle (mount, unmount)
	group(id) {
		if (!allGroups.value.has(id)) {
			allGroups.value.set(id, new Set());
		}

		return () => {
			ids.value.delete(id);
			allGroups.value.delete(id);
		};
	},
	filter: computed(() => props.shouldFilter),
	label: computed(() => props.label ?? props['aria-label']),
	disablePointerSelection: computed(() => props.disabledPointerSelection),
	labelId,
	listId,
	inputId,
	listInnerRef,
});

watchEffect(() => {
	filterItems();
	sort();

	if (!state.value) {
		nextTick(selectFirstItem);
	}
});

watch(
	() => state.search,
	() => {
		selectFirstItem();
	},
	{
		immediate: true,
		flush: 'post',
	},
);

watch(
	() => state.filtered.count,
	(newCount, oldCount) => {
		if (oldCount === 0) {
			selectFirstItem();
		}
	},
);

watch(
	[() => state.value],
	() => {
		scrollSelectedIntoView();
	},
	{
		immediate: true,
		flush: 'post',
	},
);

function score(value: string, keywords?: string[]) {
	const filter = props.filter ?? defaultFilter;
	return value ? filter(value, state.search, keywords) : 0;
}

function sort() {
	if ((!state.search || !props.shouldFilter) && !props.forceSort) {
		return;
	}

	const scores = state.filtered.items;

	// Sort the groups
	const groups: [string, number][] = [];

	for (const value of state.filtered.groups) {
		const items = allGroups.value.get(value);

		// Get the maximum score of the group's items
		let max = 0;

		for (const item of items) {
			const score = scores.get(item);
			max = Math.max(score, max);
		}

		groups.push([value, max]);
	}

	// Sort items within groups to bottom
	// Sort items outside of groups
	// Sort groups to bottom (pushes all non-grouped items to the top)
	const listInsertionElement = listInnerRef.value;

	// Sort the items
	for (const item of getValidItems()
		.sort((a, b) => {
			const valueA = a.getAttribute('id')!;
			const valueB = b.getAttribute('id')!;
			return (scores.get(valueB) ?? 0) - (scores.get(valueA) ?? 0);
		})) {
		const group = item.closest(GROUP_ITEMS_SELECTOR);

		if (group) {
			group.append(
				item.parentElement === group
					? item
					: item.closest(`${GROUP_ITEMS_SELECTOR} > *`),
			);
		}
		else {
			listInsertionElement?.append(
				item.parentElement === listInsertionElement
					? item
					: item.closest(`${GROUP_ITEMS_SELECTOR} > *`),
			);
		}
	}

	for (const [id, _] of groups
		.sort((a, b) => b[1] - a[1])) {
		const element = listInnerRef.value?.querySelector(
			`#${id.replaceAll(':', String.raw`\:`)}`,
		);

		element?.parentElement?.append(element);
	}
}

function selectFirstItem() {
	const item = getValidItems().find(
		(item) => item.getAttribute('aria-disabled') !== 'true',
	);

	const value = item?.getAttribute(VALUE_ATTR);
	state.value = value;
}

/** Filters the current items. */
function filterItems() {
	if ((!state.search || !props.shouldFilter) && !props.forceSort) {
		state.filtered.count = allItems.value.size;
		// Do nothing, each item will know to show itself because search is empty
		return;
	}

	// Reset the groups
	state.filtered.groups = new Set();
	let itemCount = 0;

	// Check which items should be included
	for (const id of allItems.value) {
		const value = ids.value.get(id)?.value ?? '';
		const keywords = ids.value.get(id)?.keywords ?? [];
		const rank = score(value, keywords);
		state.filtered.items.set(id, rank);
		if (rank > 0)
			itemCount++;
	}

	// Check which groups have at least 1 item shown
	for (const [groupId, group] of allGroups.value) {
		for (const itemId of group) {
			if ((state.filtered.items.get(itemId) ?? 0) > 0) {
				state.filtered.groups.add(groupId);
				break;
			}
		}
	}

	state.filtered.count = itemCount;
}

function scrollSelectedIntoView() {
	const item = getSelectedItem();

	if (item) {
		if (item.parentElement?.firstElementChild === item) {
			// First item in Group, ensure heading is in view
			item
				.closest(GROUP_SELECTOR)
				?.querySelector(GROUP_HEADING_SELECTOR)
				?.scrollIntoView({ block: 'nearest' });
		}

		// Ensure the item is always in view
		item.scrollIntoView({ block: 'nearest' });
	}
}

function getSelectedItem() {
	return listInnerRef.value?.querySelector(
		`${ITEM_SELECTOR}[aria-selected="true"]`,
	);
}

function getValidItems() {
	return [...listInnerRef.value?.querySelectorAll(VALID_ITEM_SELECTOR) || []];
}

function updateSelectedToIndex(index: number) {
	const items = getValidItems();
	const item = items[index];
	if (item)
		state.value = item.getAttribute(VALUE_ATTR);
}

function updateSelectedByItem(change: 1 | -1) {
	const selected = getSelectedItem();
	const items = getValidItems();
	const index = items.indexOf(selected);

	// Get item at this index
	let newSelected = items[index + change];

	if (props.loop) {
		newSelected =
			index + change < 0
				? items.at(-1)
				: index + change === items.length
					? items[0]
					: items[index + change];
	}

	if (newSelected)
		state.value = newSelected.getAttribute(VALUE_ATTR);
}

function updateSelectedByGroup(change: 1 | -1) {
	const selected = getSelectedItem();
	let group = selected?.closest(GROUP_SELECTOR);
	let item: HTMLElement;

	while (group && !item) {
		group =
			change > 0
				? findNextSibling(group, GROUP_SELECTOR)
				: findPreviousSibling(group, GROUP_SELECTOR);

		item = group?.querySelector(VALID_ITEM_SELECTOR);
	}

	if (item) {
		state.value = item.getAttribute(VALUE_ATTR);
	}
	else {
		updateSelectedByItem(change);
	}
}

const last = () => updateSelectedToIndex(getValidItems().length - 1);

function next(e: React.KeyboardEvent) {
	e.preventDefault();

	if (e.metaKey) {
		// Last item
		last();
	}
	else if (e.altKey) {
		// Next group
		updateSelectedByGroup(1);
	}
	else {
		// Next item
		updateSelectedByItem(1);
	}
}

function prev(e: React.KeyboardEvent) {
	e.preventDefault();

	if (e.metaKey) {
		// First item
		updateSelectedToIndex(0);
	}
	else if (e.altKey) {
		// Previous group
		updateSelectedByGroup(-1);
	}
	else {
		// Previous item
		updateSelectedByItem(-1);
	}
}

function handleKeyDown(e: KeyboardEvent) {
	if (!e.defaultPrevented) {
		switch (e.key) {
			case 'n':

			// eslint-disable-next-line no-fallthrough
			case 'j': {
				// vim keybind down
				if (props.vimBindings && e.ctrlKey) {
					next(e);
				}

				break;
			}

			case 'ArrowDown': {
				next(e);
				break;
			}

			case 'p':

			// eslint-disable-next-line no-fallthrough
			case 'k': {
				// vim keybind up
				if (props.vimBindings && e.ctrlKey) {
					prev(e);
				}

				break;
			}

			case 'ArrowUp': {
				prev(e);
				break;
			}

			case 'Home': {
				// First item
				e.preventDefault();
				updateSelectedToIndex(0);
				break;
			}

			case 'End': {
				// Last item
				e.preventDefault();
				last();
				break;
			}

			case 'Enter': {
				// Check if IME composition is finished before triggering onSelect
				// This prevents unwanted triggering while user is still inputting text with IME
				// e.keyCode === 229 is for the Japanese IME and Safari.
				// isComposing does not work with Japanese IME and Safari combination.
				if (!e.nativeEvent?.isComposing && e.keyCode !== 229) {
					// Trigger item onSelect
					e.preventDefault();
					const item = getSelectedItem();

					if (item) {
						const event = new Event(SELECT_EVENT);
						item.dispatchEvent(event);
					}
				}
			}
		}
	}
}
</script>

<template>
	<div cmdk-root tab-index="-1" @keydown="handleKeyDown">
		<label :id="context.labelId" cmdk-label :for="context.inputId">
			{{ label }}
		</label>
		<slot />
	</div>
</template>

<style scoped>
[cmdk-label] {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}
</style>
