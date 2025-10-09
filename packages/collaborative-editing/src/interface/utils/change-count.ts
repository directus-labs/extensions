import type { Item } from '@directus/types';
import { entries, isEqual } from 'lodash-es';

export function changeCount(base: Item, change: Item) {
	let changes = 0;

	for (const [key, value] of entries(change)) {
		if (!isEqual(value, base[key])) {
			changes++;
		}
	}

	return changes;
}
