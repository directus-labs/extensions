// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { getUserStorageKey } from '../../utils/get-user-storage-key';
import { useRecentCommands } from './use-recent-commands';

vi.mock('../../composables/use-settings', () => ({
	useSettings: () => ({ settings: ref({ recentSearchLimit: 2 }) }),
}));

beforeEach(() => {
	localStorage.clear();
	window.history.replaceState({}, '', '/admin');
});

describe('useRecentCommands', () => {
	it('ignores malformed storage and replaces it with validated command IDs', () => {
		localStorage.setItem(getUserStorageKey('command-palette:recent-commands', 'user-1'), JSON.stringify({ invalid: true }));
		const recent = useRecentCommands('user-1');

		expect(recent.commands.value).toEqual([]);
		recent.add('view-files');
		expect(recent.commands.value).toEqual(['view-files']);
	});

	it('bounds and de-duplicates command history', () => {
		const recent = useRecentCommands('user-2');
		recent.add('first');
		recent.add('second');
		recent.add('first');
		recent.add('third');

		expect(recent.commands.value).toEqual(['third', 'first']);
	});

	it('saves an entry even when its view unmounts in the same tick', async () => {
		const scope = effectScope();
		scope.run(() => useRecentCommands('user-3'))!.add('search-articles');
		scope.stop();
		await nextTick();

		expect(JSON.parse(localStorage.getItem(getUserStorageKey('command-palette:recent-commands', 'user-3'))!))
			.toEqual(['search-articles']);
	});
});
