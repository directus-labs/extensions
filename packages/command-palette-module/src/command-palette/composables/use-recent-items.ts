import type { PrimaryKey } from '@directus/types';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { z } from 'zod';
import { getUserStorageKey } from '../../utils/get-user-storage-key';

export interface RecentItem {
	collection: string;
	pk: string;
	versionKey?: string;
	versionId?: string;
}

const STORAGE_KEY = 'command-palette:recent-items';
const TOTAL_LIMIT = 50;
const PER_COLLECTION_LIMIT = 5;
const StoredRecentItem = z.object({
	collection: z.string().min(1),
	pk: z.string(),
	versionKey: z.string().optional(),
	versionId: z.string().optional(),
});

export function useRecentItems(
	userId: PrimaryKey | null | undefined,
	collection?: string,
) {
	// Write right away: picking an entry often unmounts this view in the same tick, which drops a queued write.
	const stored = userId === null || userId === undefined
		? ref<unknown>([])
		: useLocalStorage<unknown>(getUserStorageKey(STORAGE_KEY, userId), [], { flush: 'sync' });
	const allItems = computed(() => parseRecentItems(stored.value));
	const items = computed(() => {
		if (!collection) return allItems.value;
		return allItems.value
			.filter((item) => item.collection === collection)
			.slice(0, PER_COLLECTION_LIMIT);
	});

	function add(item: RecentItem) {
		if (userId === null || userId === undefined) return;

		const result = StoredRecentItem.safeParse(item);
		if (!result.success) return;

		stored.value = [
			result.data,
			...allItems.value.filter((recentItem) => !isSameItem(recentItem, result.data)),
		].slice(0, TOTAL_LIMIT);
	}

	return { items, add };
}

function parseRecentItems(value: unknown) {
	if (!Array.isArray(value)) return [];

	return value.flatMap((item) => {
		const result = StoredRecentItem.safeParse(item);
		return result.success ? [result.data] : [];
	});
}

function isSameItem(first: RecentItem, second: RecentItem) {
	return first.collection === second.collection
		&& first.pk === second.pk
		&& first.versionKey === second.versionKey
		&& first.versionId === second.versionId;
}
