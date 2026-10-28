import type { PrimaryKey } from '@directus/types';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { z } from 'zod';
import { useSettings } from '../../composables/use-settings';
import { getUserStorageKey } from '../../utils/get-user-storage-key';

const STORAGE_KEY = 'command-palette:recent-commands';
const RecentCommands = z.array(z.string());

export function useRecentCommands(userId: PrimaryKey | null | undefined) {
	const { settings } = useSettings();
	// Write right away: picking an entry often unmounts this view in the same tick, which drops a queued write.
	const stored = userId === null || userId === undefined
		? ref<unknown>([])
		: useLocalStorage<unknown>(getUserStorageKey(STORAGE_KEY, userId), [], { flush: 'sync' });
	const commands = computed(() => {
		const result = RecentCommands.safeParse(stored.value);
		return result.success ? result.data : [];
	});

	function add(id: string) {
		if (userId === null || userId === undefined) return;

		stored.value = [id, ...commands.value.filter((recentId) => recentId !== id)]
			.slice(0, settings.value?.recentSearchLimit ?? 5);
	}

	return { commands, add };
}
