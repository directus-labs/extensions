import type { useStores } from '@directus/extensions-sdk';
import type { App, VNode } from 'vue';
import { STORES_INJECT } from '@directus/constants';

export function getDirectusApp() {
	return (document.querySelector('#app') as any)?.__vue_app__ as App;
}

export function getDirectusAppRoot(): VNode {
	return getDirectusApp()._container._vnode;
}

export function getDirectusAppRootComponent(): VNode['component'] & { provides: Record<string, any> } {
	return getDirectusAppRoot().component! as any;
}

export function useDirectusAppStores() {
	const provides = getDirectusAppRootComponent().provides;
	return provides[STORES_INJECT] as ReturnType<typeof useStores>;
}
