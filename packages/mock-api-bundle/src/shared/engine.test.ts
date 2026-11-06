import type { MockCollection } from './engine';
import { describe, expect, it } from 'vitest';
import { bodyError, resolveRequest } from './engine';

const response = (name: string, status: number, body: string) => ({ name, status, body });

const collections: MockCollection[] = [
	{
		name: 'Bookmarks',
		prefix: 'bookmarks',
		endpoints: [
			{
				name: 'Bookmark',
				method: 'POST',
				path: '/bookmarks/:collection/:id',
				query: '',
				delay: 0,
				response: response('Bookmarked', 200, '{"id": {{params.id}}, "collection": "{{params.collection}}"}'),
			},
			{
				name: 'Fixed bookmark',
				method: 'POST',
				path: '/bookmarks/pages/1',
				query: '',
				delay: 0,
				response: response('Fixed', 200, '{"fixed": true}'),
			},
			{
				name: 'List shared',
				method: 'GET',
				path: '/items/:collection',
				query: 'shared=true',
				delay: 250,
				response: response('Shared', 200, '{"data": []}'),
			},
			{
				name: 'List live',
				method: 'GET',
				path: '/items/:collection',
				query: '',
				delay: 0,
				response: response('Live', 200, '{"live": true}'),
			},
			{
				name: 'Create',
				method: 'POST',
				path: '/bookmarks/:collection',
				query: '',
				delay: 0,
				response: response('Created', 201, '{"note": "{{body.note}}", "at": "{{now}}"}'),
			},
			{
				name: 'Files',
				method: 'GET',
				path: '/files/*',
				query: '',
				delay: 0,
				response: response('File', 200, '{"rest": "{{params.*}}"}'),
			},
			{
				name: 'No responses',
				method: 'DELETE',
				path: '/bookmarks/:collection/:id',
				query: '',
				delay: 0,
				response: null,
			},
		],
	},
];

const request = (method: string, url: string, body?: unknown) => {
	const [path = '', query = ''] = url.split('?');
	return { method, path, query: new URLSearchParams(query), body };
};

describe('resolveRequest', () => {
	it('fills path params into the active response', () => {
		const result = resolveRequest(collections, request('POST', '/bookmarks/bookmarks/pages/5'));
		expect(result?.endpoint.name).toBe('Bookmark');
		expect(JSON.parse(result!.body)).toEqual({ id: 5, collection: 'pages' });
	});

	it('prefers a fixed path over a param path', () => {
		expect(resolveRequest(collections, request('POST', '/bookmarks/bookmarks/pages/1'))?.endpoint.name).toBe(
			'Fixed bookmark',
		);
	});

	it('picks the endpoint whose required query is present', () => {
		const withQuery = resolveRequest(collections, request('GET', '/bookmarks/items/pages?shared=true&fields=*'));
		expect(withQuery?.endpoint.name).toBe('List shared');
		expect(withQuery?.delay).toBe(250);
		expect(resolveRequest(collections, request('GET', '/bookmarks/items/pages'))?.endpoint.name).toBe('List live');
	});

	it('fills body fields and the timestamp', () => {
		const result = resolveRequest(
			collections,
			request('POST', '/bookmarks/bookmarks/pages', { note: 'Check before launch' }),
			() => '2026-11-02T00:00:00.000Z',
		);
		expect(result?.status).toBe(201);
		expect(JSON.parse(result!.body)).toEqual({ note: 'Check before launch', at: '2026-11-02T00:00:00.000Z' });
	});

	it('a trailing wildcard captures the rest of the path', () => {
		const result = resolveRequest(collections, request('GET', '/bookmarks/files/a/b/c.png'));
		expect(JSON.parse(result!.body)).toEqual({ rest: 'a/b/c.png' });
	});

	it('a trailing wildcard needs at least one segment to capture', () => {
		expect(resolveRequest(collections, request('GET', '/bookmarks/files'))).toBeNull();
	});

	it('prefers a param over a trailing wildcard, whatever the order', () => {
		const files = (paths: string[]): MockCollection[] => [
			{
				name: 'Files',
				prefix: 'f',
				endpoints: paths.map((path) => ({ name: path, method: 'GET', path, query: '', delay: 0, response: null })),
			},
		];

		expect(resolveRequest(files(['/files/*', '/files/:id']), request('GET', '/f/files/1'))?.endpoint.name).toBe('/files/:id');
		expect(resolveRequest(files(['/*', '/:a/:b']), request('GET', '/f/x/y'))?.endpoint.name).toBe('/:a/:b');
	});

	it('reads the required query the same way as the request query', () => {
		const people = (query: string): MockCollection[] => [
			{ name: 'P', prefix: 'p', endpoints: [{ name: 'q', method: 'GET', path: '/x', query, delay: 0, response: null }] },
		];

		expect(resolveRequest(people('name=Jane+Doe'), request('GET', '/p/x?name=Jane%20Doe'))).not.toBeNull();
		expect(resolveRequest(people('token=abc=='), request('GET', '/p/x?token=abc=='))).not.toBeNull();
		expect(resolveRequest(people('token=abc=='), request('GET', '/p/x?token=abc'))).toBeNull();
	});

	it('an endpoint without responses answers 204', () => {
		expect(resolveRequest(collections, request('DELETE', '/bookmarks/bookmarks/pages/5'))).toMatchObject({
			status: 204,
			body: '',
		});
	});

	it('returns null when method, path or prefix do not match', () => {
		expect(resolveRequest(collections, request('GET', '/bookmarks/bookmarks/pages/5'))).toBeNull();
		expect(resolveRequest(collections, request('POST', '/other/bookmarks/pages/5'))).toBeNull();
		expect(resolveRequest(collections, request('POST', '/bookmarks/bookmarks/pages/5/extra'))).toBeNull();
	});
});

describe('bodyError', () => {
	it('should accept tokens inside quotes and where a number goes', () => {
		expect(bodyError('{"id": {{params.id}}, "title": "{{ body.title }}", "at": "{{now}}"}')).toBeNull();
	});

	it('should accept an empty body', () => {
		expect(bodyError('  ')).toBeNull();
	});

	it('should explain why broken JSON is invalid', () => {
		expect(bodyError('{"id": 1,}')).toEqual(expect.any(String));
	});

	it('should stay fast on an unclosed token followed by lots of whitespace', () => {
		const start = performance.now();
		bodyError(`{{${' '.repeat(50_000)}x`);
		expect(performance.now() - start).toBeLessThan(500);
	});
});
