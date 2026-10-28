import type { SearchConfigType } from '../types';
import { z } from 'zod';
import { ModuleSettings, SearchCollection } from '../types';
import { hasItemRoute } from './get-item-route';

const PersistedSettings = ModuleSettings.extend({
	collections: z.array(z.unknown()),
});

export function parsePersistedSettings(value: unknown): SearchConfigType | undefined {
	const settings = PersistedSettings.safeParse(value);
	if (!settings.success) return undefined;

	const collections = settings.data.collections.flatMap((collection) => {
		const result = SearchCollection.safeParse(collection);

		if (
			!result.success
			|| !result.data.collection
			|| result.data.fields.length === 0
			|| !hasItemRoute(result.data.collection)
		) {
			return [];
		}

		return [result.data];
	});

	return { ...settings.data, collections };
}
