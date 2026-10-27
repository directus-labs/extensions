import type { EffectScope } from 'vue';
import type { CommandAvailableContext, CommandConfig } from './types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { commands, groups } from './registry';
import { sortPositionedConfigs, useRegisteredCommands } from './use-registered-commands';

let scope: EffectScope;

beforeEach(() => {
	commands.value = [];
	groups.value = [];
	scope = effectScope();
});

afterEach(() => {
	scope.stop();
	vi.restoreAllMocks();
});

function context(path: string) {
	return { route: { path } } as CommandAvailableContext;
}

describe('sortPositionedConfigs', () => {
	it('keeps contextual commands ahead of generic matches without mutating registry order', () => {
		const configs = [
			{ id: 'generic', priority: 10 },
			{ id: 'contextual', priority: 40 },
		];

		expect(sortPositionedConfigs(configs).map(({ id }) => id)).toEqual(['contextual', 'generic']);
		expect(configs.map(({ id }) => id)).toEqual(['generic', 'contextual']);
	});

	it('publishes async commands without letting stale routes overwrite them', async () => {
		let resolveOld: ((commands: CommandConfig[]) => void) | undefined;

		commands.value = [({ route }) =>
			route.path === 'old'
				? new Promise<CommandConfig[]>((resolve) => {
					resolveOld = resolve;
				})
				: Promise.resolve([{ id: 'new', name: 'New', icon: 'add', action: () => {} }])];

		const currentContext = ref(context('old'));
		const registered = scope.run(() => useRegisteredCommands(currentContext))!;

		currentContext.value = context('new');
		await vi.waitFor(() => expect(registered.commands.value.map(({ id }) => id)).toEqual(['new']));

		resolveOld?.([{ id: 'old', name: 'Old', icon: 'history', action: () => {} }]);
		await Promise.resolve();
		expect(registered.commands.value.map(({ id }) => id)).toEqual(['new']);
	});

	it('keeps successful commands and groups when another registry callback fails', async () => {
		const error = new Error('broken callback');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		commands.value = [() => Promise.reject(error), () => [{ id: 'good', name: 'Good', icon: 'check', action: () => {} }]];
		groups.value = [() => Promise.reject(error), () => [{ id: 'good', name: 'Good' }]];

		const registered = scope.run(() => useRegisteredCommands(ref(context(''))))!;

		await vi.waitFor(() => {
			expect(registered.commands.value.map(({ id }) => id)).toEqual(['good']);
			expect(registered.groups.value.map(({ id }) => id)).toEqual(['good']);
		});

		expect(warn).toHaveBeenCalledWith(error);
	});

	it('honors before and after wildcard placement', () => {
		const sorted = sortPositionedConfigs([
			{ id: 'view-collection:posts' },
			{ id: 'last', after: '*' },
			{ id: 'create-item:posts', before: 'view-collection:*' },
			{ id: 'first', before: '*' },
		]);

		expect(sorted.map(({ id }) => id)).toEqual([
			'first',
			'create-item:posts',
			'view-collection:posts',
			'last',
		]);
	});
});
