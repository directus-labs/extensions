// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useRecentCommands } from './use-recent-commands';

vi.mock('../../composables/use-settings', () => ({
	useSettings: () => ({ settings: ref({ recentSearchLimit: 2 }) }),
}));

beforeEach(() => localStorage.clear());

describe('useRecentCommands', () => {
	it('ignores malformed storage and replaces it with validated command IDs', () => {
		localStorage.setItem('command-palette:recent-commands:user-1', JSON.stringify({ invalid: true }));
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
});
