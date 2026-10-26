import type { Router } from 'vue-router';

/** Flows moved from /settings/flows to its own module in Directus 12. */
export function getFlowsPath(router: Pick<Router, 'hasRoute'> | undefined) {
	return router?.hasRoute('flows-collection') ? '/flows' : '/settings/flows';
}
