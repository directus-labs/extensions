// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserStorageKey } from '../utils/get-user-storage-key';
import { useRecentSearches } from './use-recent-searches';

beforeEach(() => {
	localStorage.clear();
	window.history.replaceState({}, '', '/admin');
});

describe('useRecentSearches', () => {
	it('retains valid stored searches and ignores malformed entries', () => {
		const key = getUserStorageKey('command-palette:recent-searches', 'user-1');

		localStorage.setItem(key, JSON.stringify([
			{ query: 'articles', timestamp: '2025-01-01T00:00:00.000Z' },
			{ query: '', timestamp: 'not-a-date' },
		]));

		const recent = useRecentSearches('user-1');

		expect(recent.searches.value).toEqual([
			{ query: 'articles', timestamp: '2025-01-01T00:00:00.000Z' },
		]);
	});

	it('de-duplicates, reorders, and clears search history', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
		const recent = useRecentSearches('user-2');

		recent.add(' articles ');
		recent.add('users');
		vi.setSystemTime(new Date('2025-01-02T00:00:00.000Z'));
		recent.add('articles');

		expect(recent.searches.value).toEqual([
			{ query: 'articles', timestamp: '2025-01-02T00:00:00.000Z' },
			{ query: 'users', timestamp: '2025-01-01T00:00:00.000Z' },
		]);

		recent.clear();
		expect(recent.searches.value).toEqual([]);
		vi.useRealTimers();
	});

	it('scopes history to both the Directus project and user', () => {
		window.history.replaceState({}, '', '/first/admin');
		const firstProject = useRecentSearches('shared-user');
		firstProject.add('first project');

		window.history.replaceState({}, '', '/second/admin');
		expect(useRecentSearches('shared-user').searches.value).toEqual([]);
		expect(useRecentSearches('other-user').searches.value).toEqual([]);
	});
});
