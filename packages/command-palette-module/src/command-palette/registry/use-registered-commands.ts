import type { MaybeRefOrGetter, Ref } from 'vue';
import type { CommandAvailableContext, CommandConfig, GroupConfig } from './types';
import { uniqBy } from 'lodash-es';
import { computed, markRaw, ref, toValue, unref, watch } from 'vue';
import { commands, groups, registryRefresh } from './registry';

export function useRegisteredCommands(context: MaybeRefOrGetter<CommandAvailableContext>) {
	const internalCommands: Ref<CommandConfig[]> = ref([]);
	const internalGroups: Ref<GroupConfig[]> = ref([]);
	let commandRequestId = 0;
	let groupRequestId = 0;

	watch(
		[context, commands, registryRefresh],
		async () => {
			const requestId = ++commandRequestId;
			const collected = await collect(
				toValue(context),
				unref(commands),
				(command) => command.component
					? { ...command, component: markRaw(command.component) }
					: command,
			);

			if (requestId === commandRequestId) internalCommands.value = collected;
		},
		{ immediate: true },
	);

	watch(
		[context, groups, registryRefresh],
		async () => {
			const requestId = ++groupRequestId;
			const collected = await collect(toValue(context), unref(groups));

			if (requestId === groupRequestId) internalGroups.value = collected;
		},
		{ immediate: true },
	);

	return {
		groups: computed(() => sortPositionedConfigs(uniqBy(internalGroups.value, 'id'))),
		commands: computed(() => sortPositionedConfigs(uniqBy(internalCommands.value, 'id'))),
	};
}

async function collect<T>(
	context: CommandAvailableContext,
	callbacks: ((context: CommandAvailableContext) => Promise<T[]> | T[])[],
	transform: (value: T) => T = (value) => value,
) {
	// Starting from an already-resolved promise catches synchronous throws and normalizes async callbacks.
	const results = await Promise.allSettled(
		callbacks.map((callback) => Promise.resolve().then(() => callback(context))),
	);

	return results.flatMap((result) => {
		if (result.status === 'fulfilled') return result.value.map(transform);
		console.warn(result.reason);
		return [];
	});
}

export function sortPositionedConfigs<
	T extends { id: string; before?: string; after?: string; priority?: number },
>(configs: T[]) {
	return [...configs].sort((a, b) => {
		const priorityA = a.priority ?? 0;
		const priorityB = b.priority ?? 0;

		if (priorityA !== priorityB) return priorityB - priorityA;
		if (a.before === b.before && a.before !== undefined) return 0;
		if (a.after === b.after && a.after !== undefined) return 0;
		if (a.before && matchesPositionTarget(a.before, b.id)) return -1;
		if (a.after && matchesPositionTarget(a.after, b.id)) return 1;
		if (b.before && matchesPositionTarget(b.before, a.id)) return 1;
		if (b.after && matchesPositionTarget(b.after, a.id)) return -1;

		return 0;
	});
}

function matchesPositionTarget(target: string, id: string) {
	if (target === '*') return true;

	const pattern = target
		.split('*')
		.map((part) => part.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`))
		.join('.*');

	return new RegExp(`^${pattern}$`).test(id);
}
