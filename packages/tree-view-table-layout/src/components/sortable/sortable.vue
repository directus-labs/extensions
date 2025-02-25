<script setup lang="ts">
import type { ModelRef, Ref } from 'vue';
import { computed, provide, ref } from 'vue';

    type Item = Record<string, any>;
    type ItemID = string | number;
interface SortUpdateParams {
	sort: boolean;
	parent: { id: ItemID; parent: ItemID | null } | null;
}

const { itemKey, itemSort, itemDepth, itemParent, snapStep, disabled } =
        defineProps<{ itemKey: string; itemSort: string; itemDepth: string; itemParent: string | null; snapStep: number; disabled?: boolean }>();

const emit = defineEmits(['manual-sort']);

const items = defineModel<Item[]>('items');

const depthChangeMax = defineModel<number>('depthChangeMax', {
	default: 0,
});

const nestable = computed(() => itemParent !== null);

const { draggedChildrenIds, onSortStart, onDragOver, isSorting, getDepth } =
        useSortable({ items: items as ModelRef<Item[]>, depthChangeMax, snapStep, nestable });

provide('sortable', { onSortStart, nestable });

function useSortable({
	items,
	depthChangeMax,
	snapStep,
	nestable,
}: {
	items: ModelRef<Item[]>;
	depthChangeMax: ModelRef<number>;
	snapStep: number;
	nestable: Ref<boolean>;
}) {
	const draggedItemId = ref<ItemID | null>(null);
	const targetItemId = ref<ItemID | null>(null);
	const draggedItemIndex = computed(getDraggedItemIndex);
	const draggedChildren = computed(getDraggedChildren);

	const draggedChildrenIds = computed<ItemID[]>(
		() => draggedChildren.value?.map((item) => item[itemKey]) ?? [],
	);

	const draggedChildrenCount = computed(
		() => draggedChildren.value?.length ?? 0,
	);

	const draggedItemDepthOffset = ref(0);
	const initialX = ref(0);
	const intendedDepthChange = ref(0);

	return {
		draggedChildrenIds,
		onSortStart,
		onDragOver,
		isSorting,
		getDepth,
	};

	function isSorting(id: ItemID) {
		return draggedItemId.value === id;
	}

	function getDepth(item: Item) {
		if (!nestable.value)
			return 0;

		return (
			item[itemDepth]
			+ (item[itemKey] === draggedItemId.value
				|| draggedChildrenIds.value?.includes(item[itemKey])
				? draggedItemDepthOffset.value
				: 0)
		);
	}

	function getDraggedChildren(): Item[] {
		if (!draggedItemId.value || !nestable.value)
			return [];

		return getChildren(draggedItemId.value);

		function getChildren(id: ItemID) {
			const children = items.value.filter(
				(item) => item[itemParent!] === id,
			);

			let allChildren = [...children];

			for (const child of children) {
				allChildren = [
					...allChildren,
					...getChildren(child[itemKey]),
				];
			}

			return allChildren;
		}
	}

	function getDraggedItemIndex(): number | null {
		const index = items.value.findIndex(
			(item: Item) => item[itemKey] === draggedItemId.value,
		);

		return index !== -1 ? index : null;
	}

	function getCurrentDepth() {
		if (draggedItemIndex.value === null || !nestable.value)
			return 0;
		return items.value[draggedItemIndex.value][itemDepth];
	}

	function onSortStart(item: Item, event: MouseEvent) {
		if (disabled)
			return;

		initialX.value = event.clientX;
		draggedItemId.value = item[itemKey];
		intendedDepthChange.value = getCurrentDepth();

		document.addEventListener('mousemove', onSortMove);
		document.addEventListener('mouseup', onSortEnd);
	}

	function onSortMove(e: MouseEvent) {
		if (!nestable.value)
			return;

		const deltaX = e.clientX - initialX.value;
		const rawSnapDepth = Math.round(deltaX / snapStep);
		const currentDepth = getCurrentDepth();

		draggedItemDepthOffset.value = between({
			min: getMinDepth() - currentDepth,
			max: getMaxDepth() - currentDepth,
			value: rawSnapDepth,
		});

		intendedDepthChange.value =
                currentDepth + draggedItemDepthOffset.value;

		depthChangeMax.value =
                getMaxCurrentDepthWithChildren() + draggedItemDepthOffset.value;

		function getMaxCurrentDepthWithChildren() {
			if (!draggedChildrenCount.value)
				return currentDepth;
			return Math.max(
				...draggedChildren.value.map((item) => item[itemDepth]),
			);
		}

		function getMinDepth(): number {
			if (draggedItemIndex.value === 0)
				return 0;

			const maxIndex = items.value?.length - 1;

			const nextIndex =
                    draggedItemIndex.value! + 1 + draggedChildrenCount.value;

			if (nextIndex > maxIndex)
				return 0;

			return items.value[nextIndex][itemDepth];
		}

		function getMaxDepth(): number {
			const parentIndex = draggedItemIndex.value! - 1;

			if (parentIndex < 0)
				return 0;

			const parentDepth = items.value[parentIndex][itemDepth];

			return parentDepth + 1;
		}

		function between({ min, max, value }) {
			return Math.min(Math.max(value, min), max);
		}
	}

	function onDragOver(id: ItemID) {
		if (!draggedItemId.value || draggedItemId.value === id)
			return;

		const draggingIndex = items.value.findIndex(
			(item) => item[itemKey] === draggedItemId.value,
		);

		const dragOverIndex = items.value.findIndex(
			(item) => item[itemKey] === id,
		);

		if (draggingIndex === -1 || dragOverIndex === -1)
			return;

		targetItemId.value = id;

		moveItem(draggingIndex, dragOverIndex);

		function moveItem(draggingIndex: number, dragOverIndex: number) {
			const itemsToMove = items.value.splice(
				draggingIndex,
				1 + draggedChildrenCount.value,
			);

			items.value.splice(dragOverIndex, 0, ...itemsToMove);
		}
	}

	function onSortEnd() {
		const updates: SortUpdateParams = {
			sort: !!targetItemId.value,
			parent: null,
		};

		if (nestable.value) {
			updateDepth();
			updateDraggedChildrenDepth();
			updateParent();
		}

		updateSort();
		reset();
		emit('manual-sort', updates);

		function updateDepth() {
			items.value[draggedItemIndex.value!][itemDepth] =
                    intendedDepthChange.value;
		}

		function updateDraggedChildrenDepth() {
			if (draggedChildrenIds.value) {
				for (const childId of draggedChildrenIds.value) {
					const child = items.value.find(
						(item) => item[itemKey] === childId,
					);

					if (!child)
						continue;

					child[itemDepth] += draggedItemDepthOffset.value;
				}
			}
		}

		function updateParent() {
			let parentId = null;
			let parentIndex = draggedItemIndex.value! - 1;

			while (
				parentIndex >= 0
				&& items.value[parentIndex][itemDepth]
				>= intendedDepthChange.value
			) {
				parentIndex--;
			}

			if (parentIndex >= 0) {
				parentId = items.value[parentIndex][itemKey];
			}

			if (
				items.value[draggedItemIndex.value!][itemParent!]
				!== parentId
			) {
				items.value[draggedItemIndex.value!][itemParent!] =
                        parentId;

				updates.parent = {
					id: items.value[draggedItemIndex.value!][itemKey!],
					parent: parentId,
				};
			}
		}

		function updateSort() {
			items.value.map((item, index) => (item[itemSort] = index + 1));
		}

		function reset() {
			document.removeEventListener('mousemove', onSortMove);
			document.removeEventListener('mouseup', onSortEnd);

			// initialX.value = 0; // not necessary
			draggedItemDepthOffset.value = 0;
			intendedDepthChange.value = 0;
			depthChangeMax.value = 0;
			draggedItemId.value = null;
			targetItemId.value = null;
		}
	}
}
</script>

<template>
	<slot
		v-for="item in items"
		:key="item[itemKey]"
		:item="item"
		:selected="isSorting(item[itemKey])"
		:parent-selected="draggedChildrenIds?.includes(item[itemKey])"
		:on-drag-over="() => onDragOver(item[itemKey])"
		:current-depth="getDepth(item)"
	/>
</template>
