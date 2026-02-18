import type { useStores } from '@directus/extensions-sdk';
import type { VNode } from 'vue';
import { STORES_INJECT } from '@directus/constants';

export function getDirectusAppRoot(): VNode {
	return getDirectusApp()._container._vnode;
}

export function getDirectusAppRootComponent(): VNode['component'] & { provides: Record<string, unknown> } {
	return getDirectusAppRoot().component! as VNode['component'] & { provides: Record<string, unknown> };
}

export function useDirectusAppStores() {
	const provides = getDirectusAppRootComponent().provides;
	return provides[STORES_INJECT] as ReturnType<typeof useStores>;
}

export function getDirectusApp() {
	// @ts-expect-error - this is a valid type
	return document.querySelector('#app')?.__vue_app__;
}

export function getDirectusAppProvides(app?: unknown) {
	return (app ?? getDirectusApp())._container._vnode.component.provides;
}
