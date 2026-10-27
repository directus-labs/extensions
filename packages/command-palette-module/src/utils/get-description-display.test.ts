import { describe, expect, it } from 'vitest';
import { getDescriptionDisplay, hasDescriptionValue } from './get-description-display';

function store(fields: Record<string, unknown>) {
	return { getField: (_collection: string, field: string) => fields[field] ?? null };
}

describe('getDescriptionDisplay', () => {
	it('uses simple displays', () => {
		const fieldsStore = store({
			status: { type: 'string', meta: { display: 'labels', display_options: null } },
			published_on: { type: 'timestamp', meta: { display: 'datetime' } },
			featured: { type: 'boolean', meta: { display: 'boolean' } },
		});

		for (const field of ['status', 'published_on', 'featured']) {
			expect(getDescriptionDisplay(fieldsStore, 'articles', field)).not.toBeNull();
		}
	});

	it('keeps plain text for fields without a display, raw, or formatted-value without options', () => {
		const fieldsStore = store({
			bio: { type: 'text', meta: { display: null } },
			code: { type: 'string', meta: { display: 'raw' } },
			summary: { type: 'string', meta: { display: 'formatted-value', display_options: { conditionalFormatting: [] } } },
			missing_meta: { type: 'string', meta: null },
		});

		for (const field of ['bio', 'code', 'summary', 'missing_meta', 'unknown']) {
			expect(getDescriptionDisplay(fieldsStore, 'articles', field)).toBeNull();
		}
	});

	it('uses formatted-value when it has options', () => {
		const fieldsStore = store({ title: { type: 'string', meta: { display: 'formatted-value', display_options: { bold: true } } } });

		expect(getDescriptionDisplay(fieldsStore, 'articles', 'title')).not.toBeNull();
	});

	it('keeps plain text for relational and custom displays', () => {
		const fieldsStore = store({
			author: { type: 'integer', meta: { display: 'related-values' } },
			owner: { type: 'uuid', meta: { display: 'user' } },
			custom: { type: 'string', meta: { display: 'my-custom-display' } },
		});

		for (const field of ['author', 'owner', 'custom']) {
			expect(getDescriptionDisplay(fieldsStore, 'articles', field)).toBeNull();
		}
	});

	it('keeps plain text for core\'s functional displays, which the description boundary can\'t attribute', () => {
		const fieldsStore = store({
			size: { type: 'integer', meta: { display: 'filesize' } },
			type: { type: 'string', meta: { display: 'mime-type' } },
		});

		for (const field of ['size', 'type']) {
			expect(getDescriptionDisplay(fieldsStore, 'directus_files', field)).toBeNull();
		}
	});

	it('passes the props core\'s render-template gives a display', () => {
		const fieldsStore = store({
			status: {
				type: 'string',
				meta: { display: 'labels', display_options: { choices: [{ value: 'draft' }] }, interface: 'select-dropdown', options: { allowOther: true } },
			},
		});

		expect(getDescriptionDisplay(fieldsStore, 'articles', 'status')).toEqual({
			component: 'display-labels',
			props: {
				choices: [{ value: 'draft' }],
				interface: 'select-dropdown',
				interfaceOptions: { allowOther: true },
				type: 'string',
				collection: 'articles',
				field: 'status',
			},
		});
	});

	it('ignores stores that only report whether a field is readable', () => {
		expect(getDescriptionDisplay({ getField: () => true }, 'articles', 'status')).toBeNull();
	});

	it('keeps false and 0 as description values', () => {
		expect([false, 0, 'draft'].map(hasDescriptionValue)).toEqual([true, true, true]);
		expect([null, undefined, ''].map(hasDescriptionValue)).toEqual([false, false, false]);
	});
});
