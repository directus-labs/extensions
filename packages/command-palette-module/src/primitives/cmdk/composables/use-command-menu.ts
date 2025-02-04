import type { ComputedRef, DeepReadonly } from 'vue';
import type { CommandState } from '../components/command.vue';
import { computed, readonly } from 'vue';
import { injectState } from '../components/command.vue';

export function useCommandMenu<T = any>(
	selector: (state: DeepReadonly<CommandState>) => T,
): ComputedRef<T> {
	const state = injectState();
	return computed(() => selector(readonly(state)));
}
