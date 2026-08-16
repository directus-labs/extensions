import type { Router } from 'vue-router';
import type { ItemRoute } from './get-item-route';

export function isItemRouteAvailable(
	router: Router,
	route?: ItemRoute,
): route is ItemRoute {
	if (!route) return false;

	const matched = router.resolve(route).matched;
	const leaf = matched.at(-1);
	return leaf !== undefined && leaf.name !== 'private-404';
}
