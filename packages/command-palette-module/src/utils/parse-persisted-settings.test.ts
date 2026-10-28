import { describe, expect, it } from 'vitest';
import { parsePersistedSettings } from './parse-persisted-settings';

const baseSettings = {
	searchMode: 'as_you_type',
	triggerRate: 0,
	collections: [
		{
			collection: 'articles',
			fields: ['title'],
			filter: { status: { _eq: 'published' } },
			limit: -1,
		},
	],
};

describe('parsePersistedSettings', () => {
	it('preserves legacy limits, trigger rates, and nested filters', () => {
		expect(parsePersistedSettings(baseSettings)).toMatchObject(baseSettings);
	});

	it('returns routine absence for malformed top-level settings', () => {
		expect(parsePersistedSettings({ ...baseSettings, searchMode: 'invalid' })).toBeUndefined();
	});

	it('skips one malformed collection without disabling valid collections', () => {
		const settings = parsePersistedSettings({
			...baseSettings,
			collections: [
				{ collection: 'broken', fields: 'title', limit: 5 },
				...baseSettings.collections,
			],
		});

		expect(settings?.collections.map(({ collection }) => collection)).toEqual(['articles']);
	});

	it('skips collections that cannot produce searchable, navigable results', () => {
		const settings = parsePersistedSettings({
			...baseSettings,
			collections: [
				{ collection: '', fields: ['title'], limit: 5 },
				{ collection: 'empty_fields', fields: [], limit: 5 },
				{ collection: 'directus_permissions', fields: ['id'], limit: 5 },
			],
		});

		expect(settings?.collections).toEqual([]);
	});
});
