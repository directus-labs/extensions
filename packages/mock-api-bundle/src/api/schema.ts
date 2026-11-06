import type {
	ApiExtensionContext,
	CollectionMeta,
	DeepPartial,
	RawCollection,
	RawField,
	Relation,
} from '@directus/types';
import { METHODS } from '../shared/engine';
import { COLLECTIONS, ENDPOINTS, RESPONSES, SETTINGS } from '../shared/tables';
import { PREFIX_PATTERN } from '../shared/transfer';

const STATUS_CHOICES = [200, 201, 202, 204, 301, 304, 400, 401, 403, 404, 409, 422, 429, 500, 503].map((value) => ({
	text: String(value),
	value,
}));

const id: RawField = {
	field: 'id',
	type: 'integer',
	meta: { hidden: true, readonly: true },
	schema: { is_primary_key: true, has_auto_increment: true },
};
const sort: RawField = { field: 'sort', type: 'integer', meta: { hidden: true } };

type CollectionDefinition = Omit<RawCollection, 'meta'> & { meta: Partial<CollectionMeta> };

const definitions: CollectionDefinition[] = [
	{
		collection: COLLECTIONS,
		meta: { hidden: true, icon: 'api', sort_field: 'sort', display_template: '{{name}}', note: 'Mock API extension' },
		schema: {},
		fields: [
			id,
			{
				field: 'name',
				type: 'string',
				meta: { interface: 'input', width: 'half', required: true, sort: 1 },
				schema: { is_nullable: false },
			},
			{
				field: 'prefix',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					required: true,
					sort: 2,
					options: { slug: true, font: 'monospace', trim: true },
					note: 'Added after the base path. Lowercase letters, numbers and dashes.',
					validation: { _and: [{ prefix: { _regex: PREFIX_PATTERN.source } }] },
					validation_message: "Use lowercase letters, numbers and dashes. It can't start with a dash.",
				},
				schema: { is_nullable: false, is_unique: true },
			},
			{
				field: 'enabled',
				type: 'boolean',
				meta: {
					interface: 'boolean',
					special: ['cast-boolean'],
					width: 'full',
					sort: 3,
					options: { label: 'Answer requests' },
				},
				schema: { default_value: true },
			},
			{ field: 'description', type: 'text', meta: { interface: 'input-multiline', width: 'full', sort: 4 } },
			sort,
			{ field: 'endpoints', type: 'alias', meta: { special: ['o2m'], interface: 'list-o2m', hidden: true } },
		],
	},
	{
		collection: ENDPOINTS,
		meta: { hidden: true, icon: 'api', sort_field: 'sort', display_template: '{{method}} {{path}}' },
		schema: {},
		fields: [
			id,
			{
				field: 'collection',
				type: 'integer',
				meta: { special: ['m2o'], interface: 'select-dropdown-m2o', hidden: true },
			},
			{
				field: 'name',
				type: 'string',
				meta: { interface: 'input', width: 'half', required: true, sort: 1 },
				schema: { is_nullable: false },
			},
			{
				field: 'method',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					required: true,
					sort: 2,
					options: { choices: METHODS.map((m) => ({ text: m, value: m })) },
					display: 'labels',
				},
				schema: { default_value: 'GET', is_nullable: false },
			},
			{
				field: 'path',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'full',
					required: true,
					sort: 3,
					options: { font: 'monospace', placeholder: '/bookmarks/:collection/:id', trim: true },
					note: 'Use :name for path params, and a trailing * to match the rest of the path.',
				},
				schema: { is_nullable: false },
			},
			{
				field: 'query',
				type: 'string',
				meta: {
					interface: 'input',
					width: 'half',
					sort: 4,
					options: { font: 'monospace', placeholder: 'shared=true', trim: true },
					note: 'Only answers when these query values are present.',
				},
			},
			{
				field: 'delay',
				type: 'integer',
				meta: {
					interface: 'input',
					width: 'half',
					sort: 5,
					options: { min: 0, step: 50 },
					note: 'Milliseconds to wait before responding.',
				},
				schema: { default_value: 0 },
			},
			{
				field: 'responses_divider',
				type: 'alias',
				meta: {
					special: ['alias', 'no-data'],
					interface: 'presentation-divider',
					width: 'full',
					sort: 6,
					options: { title: 'Responses' },
				},
			},
			{
				field: 'responses',
				type: 'alias',
				meta: {
					special: ['o2m'],
					interface: 'list-o2m',
					width: 'full',
					sort: 7,
					options: { template: '{{name}} · {{status}}', enableSelect: false, enableSearchFilter: false },
				},
			},
			{
				field: 'active_response',
				type: 'integer',
				meta: {
					special: ['m2o'],
					interface: 'select-dropdown-m2o',
					width: 'full',
					sort: 8,
					options: { template: '{{name}} · {{status}}', enableCreate: false, filter: { endpoint: { _eq: '{{id}}' } } },
					note: 'The response this endpoint returns. Save new responses first. Leave empty to use the first one.',
				},
			},
			{
				field: 'notes',
				type: 'text',
				meta: {
					interface: 'input-multiline',
					width: 'full',
					sort: 9,
					note: 'What this endpoint stands in for, such as a spec section, ticket or design.',
				},
			},
			sort,
		],
	},
	{
		collection: RESPONSES,
		meta: { hidden: true, icon: 'data_object', sort_field: 'sort', display_template: '{{name}} · {{status}}' },
		schema: {},
		fields: [
			id,
			{
				field: 'endpoint',
				type: 'integer',
				meta: { special: ['m2o'], interface: 'select-dropdown-m2o', hidden: true },
			},
			{
				field: 'name',
				type: 'string',
				meta: { interface: 'input', width: 'half', required: true, sort: 1 },
				schema: { is_nullable: false },
			},
			{
				field: 'status',
				type: 'integer',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					required: true,
					sort: 2,
					options: { choices: STATUS_CHOICES, allowOther: true },
				},
				schema: { default_value: 200, is_nullable: false },
			},
			{
				field: 'body',
				type: 'text',
				meta: {
					interface: 'input-code',
					width: 'full',
					sort: 3,
					options: { language: 'JSON', lineNumber: true, template: '{\n  "data": {}\n}' },
					note: 'Tokens: {{params.id}}, {{query.fields}}, {{body.title}}, {{now}}, {{uuid}}. Leave empty for a 204.',
				},
			},
			sort,
		],
	},
	{
		collection: SETTINGS,
		meta: { hidden: true, singleton: true, icon: 'tune' },
		schema: {},
		fields: [
			id,
			{
				field: 'require_auth',
				type: 'boolean',
				meta: {
					interface: 'boolean',
					special: ['cast-boolean'],
					width: 'full',
					sort: 2,
					options: { label: 'Require a signed-in user' },
					note: 'Mock routes check the access token like real routes do.',
				},
				schema: { default_value: true },
			},
		],
	},
];

const relations: DeepPartial<Relation>[] = [
	{
		collection: ENDPOINTS,
		field: 'collection',
		related_collection: COLLECTIONS,
		meta: { one_field: 'endpoints', sort_field: 'sort', one_deselect_action: 'delete' },
		schema: { on_delete: 'CASCADE' },
	},
	{
		collection: RESPONSES,
		field: 'endpoint',
		related_collection: ENDPOINTS,
		meta: { one_field: 'responses', sort_field: 'sort', one_deselect_action: 'delete' },
		schema: { on_delete: 'CASCADE' },
	},
	{
		collection: ENDPOINTS,
		field: 'active_response',
		related_collection: RESPONSES,
		meta: { one_field: null },
		schema: { on_delete: 'SET NULL' },
	},
];

let ready: Promise<void> | null = null;

export function ensureSchema(context: ApiExtensionContext): Promise<void> {
	ready ??= setup(context).catch((error) => {
		ready = null;
		context.logger.error(error, '[mock-api] Could not create the Mock API collections');
		throw error;
	});

	return ready;
}

async function setup({ services, getSchema, database, logger }: ApiExtensionContext): Promise<void> {
	const { CollectionsService, RelationsService } = services;

	for (const definition of definitions) {
		const schema = await getSchema({ bypassCache: true });
		if (schema.collections[definition.collection]) continue;

		await new CollectionsService({ schema, knex: database }).createOne(definition);
		logger.info(`[mock-api] Created ${definition.collection}`);
	}

	for (const relation of relations) {
		const schema = await getSchema({ bypassCache: true });
		const exists = schema.relations.some((r) => r.collection === relation.collection && r.field === relation.field);
		if (exists) continue;

		await new RelationsService({ schema, knex: database }).createOne(relation as Partial<Relation>);
	}
}
