// @vitest-environment happy-dom

import type { CommandAvailableContext, CommandConfig } from '../command-palette';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { copyApiUrlCommands } from './copy-api-url';

const add = vi.fn();

function commands(primaryKey?: string, query: Record<string, string> = {}) {
	const callback = copyApiUrlCommands.commands as (context: CommandAvailableContext) => CommandConfig[];
	const path = primaryKey ? `/content/articles/${primaryKey}` : '/content/articles';

	return callback({
		i18n: { t: (key: string) => key, te: () => true },
		route: { path, params: { collection: 'articles', ...(primaryKey ? { primaryKey } : {}) }, query },
		stores: { useNotificationsStore: () => ({ add }) },
	} as unknown as CommandAvailableContext);
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
	Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

const router = createRouter({ history: createMemoryHistory('/admin/'), routes: [{ path: '/:all(.*)', component: {} }] });

describe('copyApiUrlCommands', () => {
	it('adds item link and ID only on existing items', () => {
		expect(commands().map(({ id }) => id)).toEqual(['copy-api-url']);
		expect(commands('+').map(({ id }) => id)).toEqual(['copy-api-url']);
		expect(commands('1').map(({ id }) => id)).toEqual(['copy-api-url', 'copy-item-link', 'copy-item-id']);
	});

	it('copies the Studio link with the version, and the raw ID, and confirms each copy', async () => {
		const writeText = vi.fn(async (_text: string) => {});
		stubClipboard(writeText);
		add.mockClear();
		const [, link, id] = commands('a b', { version: 'review', tab: 'x' });

		expect(await link!.action!({ router })).toBe(true);
		expect(await id!.action!({ router })).toBe(true);

		expect(writeText.mock.calls).toEqual([
			[new URL('/admin/content/articles/a%20b?version=review', window.location.href).toString()],
			['a b'],
		]);

		expect(add.mock.calls).toEqual([
			[{ title: 'copy_raw_value_success' }],
			[{ title: 'copy_raw_value_success' }],
		]);
	});

	it('reports a failed copy and keeps the palette open', async () => {
		stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
		add.mockClear();
		const [apiUrl] = commands('1');

		expect(await apiUrl!.action!({ router })).toBe(false);
		expect(add).toHaveBeenCalledWith({ type: 'error', title: 'copy_raw_value_fail' });
	});
});
