import type { MockResponse } from './engine';
import type { ExportEndpoint, ExportFile } from './transfer';
import { errorBody } from './errors';
import { EXPORT_FORMAT, EXPORT_VERSION } from './transfer';

const json = (value: unknown) => JSON.stringify(value, null, 2);
const response = (name: string, status: number, body: unknown = ''): MockResponse => ({
	name,
	status,
	body: typeof body === 'string' ? body : json(body),
});

const endpoint = (
	name: string,
	method: string,
	path: string,
	notes: string,
	responses: MockResponse[],
	options: { query?: string; delay?: number } = {},
): ExportEndpoint => ({
	name,
	method,
	path,
	query: options.query ?? '',
	delay: options.delay ?? 0,
	notes,
	active_response: responses[0]?.name ?? null,
	responses,
});

const task = (id: number, title: string, status: string) => ({
	id,
	title,
	status,
	date_created: '2026-11-02T09:00:00.000Z',
});

// Typed as a template rather than JSON: tokens like {{params.id}} sit outside quotes so ids stay numbers.
const taskById =
	'{\n  "data": {\n    "id": {{params.id}},\n    "title": "Write the release notes",\n    "status": "todo"\n  }\n}';

export const EXAMPLE_PREFIX = 'example';

export const EXAMPLE: ExportFile = {
	format: EXPORT_FORMAT,
	version: EXPORT_VERSION,
	exported_at: '2026-11-02T00:00:00.000Z',
	collections: [
		{
			name: 'Example: Tasks API',
			prefix: EXAMPLE_PREFIX,
			enabled: true,
			description:
				'A small tasks API that shows each feature of the extension. Edit it, copy it, or delete it when you no longer need it.',
			endpoints: [
				endpoint(
					'List finished tasks',
					'GET',
					'/tasks',
					'Required query: answers only when the request has ?status=done. Other query params are ignored. When two endpoints match equally, the higher one in the list wins, so this sits above "List tasks".',
					[response('Finished', 200, { data: [task(3, 'Update the logo', 'done')] })],
					{ query: 'status=done' },
				),
				endpoint(
					'List tasks',
					'GET',
					'/tasks',
					'Two responses: switch the active one to see how your UI handles an empty list. The delay lets you see loading states.',
					[
						response('Some tasks', 200, {
							data: [
								task(1, 'Write the release notes', 'todo'),
								task(2, 'Review the pricing page', 'in_progress'),
								task(3, 'Update the logo', 'done'),
							],
						}),
						response('Empty', 200, { data: [] }),
					],
					{ delay: 400 },
				),
				endpoint(
					'Get a task',
					'GET',
					'/tasks/:id',
					"Path param: {{params.id}} is replaced with the id from the URL. Directus answers 403 for items that don't exist, so the missing response does too.",
					[
						response('Found', 200, taskById),
						response('Missing', 403, errorBody("You don't have permission to access this.", 'FORBIDDEN')),
					],
				),
				endpoint(
					'Create a task',
					'POST',
					'/tasks',
					'Body tokens: {{body.title}} echoes the request body. {{uuid}} and {{now}} are new on every request.',
					[
						response(
							'Created',
							200,
							'{\n  "data": {\n    "id": "{{uuid}}",\n    "title": "{{body.title}}",\n    "status": "todo",\n    "date_created": "{{now}}"\n  }\n}',
						),
						response(
							'Validation error',
							400,
							errorBody('Validation failed for field "title". Value is required.', 'FAILED_VALIDATION', {
								field: 'title',
								type: 'required',
							}),
						),
					],
					{ delay: 300 },
				),
				endpoint('Update a task', 'PATCH', '/tasks/:id', 'Combines a path param with body tokens.', [
					response(
						'Updated',
						200,
						'{\n  "data": {\n    "id": {{params.id}},\n    "title": "{{body.title}}",\n    "status": "{{body.status}}"\n  }\n}',
					),
				]),
				endpoint(
					'Delete a task',
					'DELETE',
					'/tasks/:id',
					'An empty body with status 204, the way Directus answers deletes.',
					[response('Deleted', 204)],
				),
				endpoint(
					'Get a file',
					'GET',
					'/files/*',
					'Wildcard: a trailing * matches the rest of the path, available as {{params.*}}.',
					[response('File info', 200, { data: { filename_disk: '{{params.*}}', type: 'image/png' } })],
				),
			],
		},
	],
};
