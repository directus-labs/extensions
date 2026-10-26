import type { Flow } from '@directus/types';
import type { CommandAvailableContext } from '../../command-palette';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { collectionItemFlowCommands } from './flow-commands';

function flow(): Flow {
	return {
		id: 'flow-1',
		name: 'Publish',
		icon: null,
		description: null,
		status: 'active',
		trigger: 'manual',
		options: { requireSelection: false },
		operation: null,
		accountability: 'all',
	};
}

function getCommands(options: { post: ReturnType<typeof vi.fn>; primaryKey?: string; refreshUnreadCount?: ReturnType<typeof vi.fn> }) {
	const callback = collectionItemFlowCommands.commands;
	if (typeof callback !== 'function') throw new Error('Flow command callback is unavailable');

	const primaryKey = options.primaryKey ?? '1';

	return callback({
		api: { post: options.post },
		i18n: { t: (key: string) => key, te: () => false },
		route: {
			path: `/content/articles/${primaryKey}`,
			params: { collection: 'articles', primaryKey },
			query: {},
		},
		search: '',
		stores: {
			useFlowsStore: () => ({ getManualFlowsForCollection: () => [flow()] }),
			useNotificationsStore: () => ({ add: vi.fn(), refreshUnreadCount: options.refreshUnreadCount }),
		},
	} as unknown as CommandAvailableContext);
}

async function runAction(commands: Awaited<ReturnType<typeof getCommands>>) {
	const action = commands[0]?.action;
	if (!action) throw new Error('Immediate flow action is unavailable');

	const router = createRouter({ history: createMemoryHistory(), routes: [] });
	return action({ router });
}

describe('collectionItemFlowCommands', () => {
	it('returns false so the palette remains open when an immediate flow fails', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const commands = await getCommands({ post: vi.fn().mockRejectedValue(new Error('offline')) });

		expect(await runAction(commands)).toBe(false);
	});

	it('closes after a successful flow even when the unread count refresh fails', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const post = vi.fn().mockResolvedValue({});
		const commands = await getCommands({ post, refreshUnreadCount: vi.fn().mockRejectedValue(new Error('offline')) });

		expect(await runAction(commands)).toBe(true);
		expect(post).toHaveBeenCalledOnce();
	});

	it('hides flows while creating a new item', async () => {
		const commands = await getCommands({ post: vi.fn(), primaryKey: '+' });

		expect(commands).toEqual([]);
	});
});
