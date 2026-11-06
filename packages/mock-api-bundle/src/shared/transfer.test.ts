import type { ExportFile } from './transfer';
import { describe, expect, it } from 'vitest';
import { describePlan, endpointKey, planImport, validateExport } from './transfer';

const endpoint = (method: string, path: string, query = '') => ({
	name: `${method} ${path}`,
	method,
	path,
	query,
	delay: 0,
	notes: '',
	active_response: null,
	responses: [],
});

const file: ExportFile = {
	format: 'directus-mock-api',
	version: 1,
	exported_at: '2026-11-02T00:00:00.000Z',
	collections: [
		{
			name: 'Bookmarks',
			prefix: 'bookmarks',
			enabled: true,
			description: '',
			endpoints: [endpoint('POST', '/bookmarks/:collection/:id'), endpoint('POST', '/bookmarks/:collection')],
		},
		{ name: 'Search', prefix: 'search', enabled: true, description: '', endpoints: [endpoint('GET', '/search')] },
	],
};

const local = [
	{
		prefix: 'bookmarks',
		endpointKeys: [endpointKey(endpoint('POST', 'bookmarks/:collection/:id/')), endpointKey(endpoint('GET', '/mine'))],
	},
	{ prefix: 'bookmarks-2', endpointKeys: [] },
];

describe('planImport', () => {
	it('merge updates matching endpoints, adds new ones and keeps the rest', () => {
		const plan = planImport(local, file, 'merge');
		expect(plan).toMatchObject({ newCollections: 1, endpointsAdded: 2, endpointsUpdated: 1, endpointsKept: 1 });
		expect(describePlan(plan)).toBe('1 new collection, 2 endpoints added, 1 updated, 1 of yours kept.');
	});

	it('replace swaps the whole collection', () => {
		expect(planImport(local, file, 'replace')).toMatchObject({
			replacedCollections: 1,
			newCollections: 1,
			endpointsAdded: 3,
			endpointsUpdated: 0,
		});
	});

	it('copy picks the first free prefix', () => {
		const plan = planImport(local, file, 'copy');

		expect(plan.collections.find((c) => c.prefix === 'bookmarks')).toEqual({
			prefix: 'bookmarks',
			action: 'copy',
			targetPrefix: 'bookmarks-3',
		});
	});

	it('copy skips prefixes used later in the same file', () => {
		const incoming = { ...file, collections: [file.collections[0]!, { ...file.collections[0]!, prefix: 'bookmarks-3' }] };
		const targets = planImport(local, incoming, 'copy').collections.map((c) => c.targetPrefix);
		expect(targets).toEqual(['bookmarks-4', 'bookmarks-3']);
	});
});

describe('endpointKey', () => {
	it('keeps an encoded & or = inside a query value apart from a real one', () => {
		expect(endpointKey(endpoint('GET', '/x', 'a=x%26b%3Dy'))).not.toBe(endpointKey(endpoint('GET', '/x', 'a=x&b=y')));
	});

	it('ignores query order', () => {
		expect(endpointKey(endpoint('GET', '/x', 'b=2&a=1'))).toBe(endpointKey(endpoint('GET', '/x', '?a=1&b=2')));
	});
});

describe('validateExport', () => {
	it('accepts a valid file given as a string', () => {
		expect(validateExport(JSON.stringify(file))).toHaveProperty('file');
	});

	it.each([
		['not json', 'The file is not valid JSON.'],
		[{ format: 'other', collections: [] }, 'This is not a Mock API export'],
		[{ ...file, version: 99 }, 'Update the Mock API extension'],
		[{ ...file, collections: [{ ...file.collections[0], prefix: '_meta' }] }, 'needs a prefix'],
		[
			{ ...file, collections: [{ ...file.collections[0], endpoints: [endpoint('TRACE', '/x')] }] },
			'unsupported method',
		],
		[{ ...file, version: 0 }, "which doesn't exist"],
		[
			{
				...file,
				collections: [
					{
						...file.collections[0],
						endpoints: [{ ...endpoint('GET', '/x'), responses: [{ name: 'Broken', status: 200, body: '{"a": }' }] }],
					},
				],
			},
			'Response "Broken" of "GET /x" in "Bookmarks" isn\'t valid JSON',
		],
		[{ ...file, version: 0.5 }, "which doesn't exist"],
		[
			{ ...file, collections: [{ ...file.collections[0], endpoints: [endpoint('GET', '')] }] },
			'missing its name or path',
		],
		[{ ...file, collections: [{ ...file.collections[0], endpoints: 'nope' }] }, 'must be a list'],
		[
			{ ...file, collections: [{ ...file.collections[0], endpoints: [{ ...endpoint('GET', '/x'), responses: {} }] }] },
			'must be a list',
		],
		[
			{ ...file, collections: [file.collections[0], file.collections[0]] },
			'Two collections in this file use the prefix "bookmarks"',
		],
		[
			{ ...file, collections: [{ ...file.collections[0], endpoints: [endpoint('GET', '/x'), endpoint('get', 'x/')] }] },
			'has two endpoints for GET /x',
		],
	])('rejects %j', (input, message) => {
		const result = validateExport(input);
		expect('error' in result && result.error).toContain(message);
	});
});
