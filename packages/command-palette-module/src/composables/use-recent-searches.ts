import type { PrimaryKey } from '@directus/types';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { z } from 'zod';
import { getUserStorageKey } from '../utils/get-user-storage-key';

export interface RecentSearch {
	query: string;
	timestamp: string;
}

const STORAGE_KEY = 'command-palette:recent-searches';
const LIMIT = 50;
const StoredRecentSearch = z.object({
	query: z.string().min(1),
	timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
});

export function useRecentSearches(userId: PrimaryKey | null | undefined) {
	const stored = userId === null || userId === undefined
		? ref<unknown>([])
		: useLocalStorage<unknown>(getUserStorageKey(STORAGE_KEY, userId), []);
	const searches = computed(() => parseRecentSearches(stored.value));

	function add(value: string) {
		if (userId === null || userId === undefined) return;

		const query = value.trim();
		if (!query) return;

		stored.value = [
			{ query, timestamp: new Date().toISOString() },
			...searches.value.filter((search) => search.query !== query),
		].slice(0, LIMIT);
	}

	function clear() {
		if (userId === null || userId === undefined) return;
		stored.value = [];
	}

	return { searches, add, clear };
}

function parseRecentSearches(value: unknown) {
	if (!Array.isArray(value)) return [];

	return value.flatMap((search) => {
		const result = StoredRecentSearch.safeParse(search);
		return result.success ? [result.data] : [];
	});
}
