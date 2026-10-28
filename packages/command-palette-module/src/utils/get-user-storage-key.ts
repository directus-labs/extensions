import type { PrimaryKey } from '@directus/types';
import { getPublicURL } from './get-root-path';

/** Create a project- and user-scoped browser storage key. */
export function getUserStorageKey(namespace: string, userId: PrimaryKey) {
	const project = encodeURIComponent(getPublicURL());
	const user = encodeURIComponent(String(userId));
	return `${namespace}:${project}:${user}`;
}
