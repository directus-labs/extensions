import type { MockCollection } from './engine';
import { describe, expect, it } from 'vitest';
import { resolveRequest } from './engine';
import { EXAMPLE } from './example';
import { validateExport } from './transfer';

const collections: MockCollection[] = EXAMPLE.collections.map((c) => ({
	...c,
	endpoints: c.endpoints.map((e) => ({
		...e,
		response: e.responses.find((r) => r.name === e.active_response) ?? null,
	})),
}));

const send = (method: string, url: string, body?: unknown) => {
	const [path = '', query = ''] = url.split('?');
	const result = resolveRequest(collections, { method, path, query: new URLSearchParams(query), body }, () => 'NOW');
	return {
		name: result?.endpoint.name,
		status: result?.status,
		data: result?.body ? JSON.parse(result.body).data : undefined,
	};
};

describe('EXAMPLE', () => {
	it('should pass import validation', () => {
		expect(validateExport(JSON.stringify(EXAMPLE))).toHaveProperty('file');
	});

	it('should answer the request each endpoint note describes', () => {
		expect(send('GET', '/example/tasks')).toMatchObject({ name: 'List tasks', status: 200 });
		expect(send('GET', '/example/tasks?status=done&fields=*')).toMatchObject({ name: 'List finished tasks' });
		expect(send('GET', '/example/tasks/7').data).toMatchObject({ id: 7 });

		expect(send('POST', '/example/tasks', { title: 'Ship it' }).data).toMatchObject({
			title: 'Ship it',
			date_created: 'NOW',
		});

		expect(send('PATCH', '/example/tasks/2', { title: 'Renamed', status: 'done' }).data).toEqual({
			id: 2,
			title: 'Renamed',
			status: 'done',
		});

		expect(send('DELETE', '/example/tasks/2')).toMatchObject({ status: 204 });
		expect(send('GET', '/example/files/brand/logo.png').data).toMatchObject({ filename_disk: 'brand/logo.png' });
	});
});
