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

describe('collectionItemFlowCommands', () => {
	it('returns false so the palette remains open when an immediate flow fails', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const callback = collectionItemFlowCommands.commands;
		if (typeof callback !== 'function') throw new Error('Flow command callback is unavailable');

		const commands = await callback({
			api: { post: vi.fn().mockRejectedValue(new Error('offline')) },
			i18n: { t: (key: string) => key, te: () => false },
			route: {
				path: '/content/articles/1',
				params: { collection: 'articles', primaryKey: '1' },
				query: {},
			},
			search: '',
			stores: {
				useFlowsStore: () => ({ getManualFlowsForCollection: () => [flow()] }),
				useNotificationsStore: () => ({ add: vi.fn() }),
			},
		} as unknown as CommandAvailableContext);
		const action = commands[0]?.action;
		if (!action) throw new Error('Immediate flow action is unavailable');

		const router = createRouter({ history: createMemoryHistory(), routes: [] });
		const result = await Promise.resolve(action({ router }));
		expect(result).toBe(false);
	});
});
