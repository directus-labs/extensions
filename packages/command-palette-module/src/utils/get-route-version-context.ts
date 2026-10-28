import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { getRouteQueryValue } from './get-route-query-value';

export type RouteVersionContext =
	| { versionKey: string; versionId?: string }
	| { versionKey?: never; versionId?: never };

export function getRouteVersionContext(route: RouteLocationNormalizedLoaded): RouteVersionContext {
	const versionKey = getRouteQueryValue(route.query.version);
	if (!versionKey) return {};

	const versionId = getRouteQueryValue(route.query.versionId);
	return { versionKey, ...(versionId ? { versionId } : {}) };
}
