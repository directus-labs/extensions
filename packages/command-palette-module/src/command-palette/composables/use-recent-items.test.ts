// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from 'vitest';
import { effectScope, nextTick } from 'vue';
import { getUserStorageKey } from '../../utils/get-user-storage-key';
import { useRecentItems } from './use-recent-items';

beforeEach(() => {
	localStorage.clear();
	window.history.replaceState({}, '', '/admin');
});

describe('useRecentItems', () => {
	it('retains valid stored items and ignores malformed entries', () => {
		const key = getUserStorageKey('command-palette:recent-items', 'user-1');

		localStorage.setItem(key, JSON.stringify([
			{ collection: 'articles', pk: '1' },
			{ collection: 'articles' },
		]));

		const recent = useRecentItems('user-1', 'articles');

		expect(recent.items.value).toEqual([
			{ collection: 'articles', pk: '1' },
		]);
	});

	it('bounds each collection and moves selected items to the front', () => {
		const recent = useRecentItems('user-2', 'articles');

		for (let id = 1; id <= 6; id++) {
			recent.add({ collection: 'articles', pk: String(id) });
		}

		recent.add({ collection: 'articles', pk: '3' });

		expect(recent.items.value.map(({ pk }) => pk)).toEqual(['3', '6', '5', '4', '2']);
	});

	it('scopes history to both the Directus project and user', () => {
		window.history.replaceState({}, '', '/first/admin');
		const firstProject = useRecentItems('shared-user');
		firstProject.add({ collection: 'articles', pk: '1' });

		window.history.replaceState({}, '', '/second/admin');
		const secondProject = useRecentItems('shared-user');
		const secondUser = useRecentItems('other-user');

		expect(secondProject.items.value).toEqual([]);
		expect(secondUser.items.value).toEqual([]);
	});

	it('saves an item even when its view unmounts in the same tick', async () => {
		const scope = effectScope();
		scope.run(() => useRecentItems('user-3', 'articles'))!.add({ collection: 'articles', pk: '3' });
		scope.stop();
		await nextTick();

		expect(JSON.parse(localStorage.getItem(getUserStorageKey('command-palette:recent-items', 'user-3'))!))
			.toEqual([{ collection: 'articles', pk: '3' }]);
	});
});
