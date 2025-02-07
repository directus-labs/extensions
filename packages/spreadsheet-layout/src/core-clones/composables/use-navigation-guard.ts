import type { Ref } from 'vue';
import type { NavigationGuard } from 'vue-router';
import { useEventListener } from '@vueuse/core';
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';

export function useNavigationGuard(locked: Ref<boolean>, guard: NavigationGuard) {
	useEventListener(document, 'beforeunload', (event) => {
		if (locked.value)
			event.preventDefault();
	});

	onBeforeRouteUpdate(guard);
	onBeforeRouteLeave(guard);
}
