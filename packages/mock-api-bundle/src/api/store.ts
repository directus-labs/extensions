import type { Accountability, ApiExtensionContext } from '@directus/types';
import type { Knex } from 'knex';
import type { MockCollection } from '../shared/engine';
import type { ExportCollection, ExportEndpoint, ExportFile, ImportPlan, ImportStrategy, LocalCollectionSummary } from '../shared/transfer';
import { trimSlashes } from '../shared/engine';
import { COLLECTIONS, ENDPOINTS, RESPONSES, SETTINGS } from '../shared/tables';
import {
	endpointKey,
	EXPORT_FORMAT,
	EXPORT_VERSION,

	planImport,
} from '../shared/transfer';

type Row = Record<string, any>;
type EndpointRow = Row & { id: number; method: string; path: string; query: string | null };

const bySort = (a: Row, b: Row) => (a['sort'] ?? Infinity) - (b['sort'] ?? Infinity) || a['id'] - b['id'];

async function readTree(knex: Knex, collectionIds?: number[], enabledOnly = false) {
	let collectionsQuery = knex(COLLECTIONS).select('*');
	if (collectionIds) collectionsQuery = collectionsQuery.whereIn('id', collectionIds);
	if (enabledOnly) collectionsQuery = collectionsQuery.where('enabled', true);

	const collections = (await collectionsQuery).sort(bySort);
	const ids = collections.map((c) => c.id);
	const endpoints = ids.length > 0 ? (await knex(ENDPOINTS).select('*').whereIn('collection', ids)).sort(bySort) : [];
	const endpointIds = endpoints.map((e) => e.id);
	const responses = endpointIds.length > 0
		? (await knex(RESPONSES).select('*').whereIn('endpoint', endpointIds)).sort(bySort)
		: [];

	return collections.map((collection) => ({
		...collection,
		endpoints: endpoints
			.filter((e) => e.collection === collection.id)
			.map((endpoint) => ({ ...endpoint, responses: responses.filter((r) => r.endpoint === endpoint.id) })),
	}));
}

export async function loadMocks(knex: Knex): Promise<MockCollection[]> {
	const tree = await readTree(knex, undefined, true);

	return tree.map((collection) => ({
		name: collection.name,
		prefix: collection.prefix,
		endpoints: collection.endpoints.map((endpoint: Row) => {
			const active =
				endpoint.responses.find((r: Row) => r.id === endpoint.active_response) ?? endpoint.responses[0] ?? null;

			return {
				name: endpoint.name,
				method: endpoint.method,
				path: endpoint.path,
				query: endpoint.query ?? '',
				delay: endpoint.delay ?? 0,
				response: active ? { name: active.name, status: Number(active.status), body: active.body ?? '' } : null,
			};
		}),
	}));
}

export async function requiresAuth(knex: Knex): Promise<boolean> {
	const row = await knex(SETTINGS).select('require_auth').first();
	return row ? Boolean(row.require_auth) : true;
}

export async function buildExport(knex: Knex, collectionIds?: number[]): Promise<ExportFile> {
	const tree = await readTree(knex, collectionIds);

	return {
		format: EXPORT_FORMAT,
		version: EXPORT_VERSION,
		exported_at: new Date().toISOString(),
		collections: tree.map((collection) => ({
			name: collection.name,
			prefix: collection.prefix,
			enabled: Boolean(collection.enabled),
			description: collection.description ?? '',
			endpoints: collection.endpoints.map((endpoint: Row) => ({
				name: endpoint.name,
				method: endpoint.method,
				path: endpoint.path,
				query: endpoint.query ?? '',
				delay: endpoint.delay ?? 0,
				notes: endpoint.notes ?? '',
				active_response: endpoint.responses.find((r: Row) => r.id === endpoint.active_response)?.name ?? null,
				responses: endpoint.responses.map((r: Row) => ({ name: r.name, status: Number(r.status), body: r.body ?? '' })),
			})),
		})),
	};
}

async function localSummaries(
	knex: Knex,
): Promise<(LocalCollectionSummary & { id: number; endpoints: EndpointRow[] })[]> {
	const tree = await readTree(knex);
	return tree.map((c) => ({
		id: c.id,
		prefix: c.prefix,
		endpoints: c.endpoints,
		endpointKeys: c.endpoints.map(endpointKey),
	}));
}

export async function previewImport(knex: Knex, file: ExportFile, strategy: ImportStrategy): Promise<ImportPlan> {
	return planImport(await localSummaries(knex), file, strategy);
}

function endpointPayload(endpoint: ExportEndpoint) {
	return {
		name: endpoint.name,
		method: endpoint.method.toUpperCase(),
		path: endpoint.path,
		query: endpoint.query ?? '',
		delay: endpoint.delay ?? 0,
		notes: endpoint.notes ?? '',
		responses: (endpoint.responses ?? []).map((r) => ({
			name: r.name,
			status: Number(r.status) || 200,
			body: r.body ?? '',
		})),
	};
}

export async function applyImport(
	{ services, getSchema, database }: ApiExtensionContext,
	accountability: Accountability | null,
	file: ExportFile,
	strategy: ImportStrategy,
): Promise<ImportPlan> {
	const { ItemsService } = services;

	return database.transaction(async (trx) => {
		const schema = await getSchema();
		const opts = { schema, knex: trx, accountability };
		const collectionsService = new ItemsService(COLLECTIONS, opts);
		const endpointsService = new ItemsService(ENDPOINTS, opts);

		const local = await localSummaries(trx);
		const plan = planImport(local, file, strategy);

		async function setActiveResponse(endpointId: number, activeName: string | null) {
			if (!activeName) return;
			const response = await trx(RESPONSES).select('id').where({ endpoint: endpointId, name: activeName }).first();
			if (response) await endpointsService.updateOne(endpointId, { active_response: response.id });
		}

		async function createCollection(incoming: ExportCollection, prefix: string, name: string) {
			const id = await collectionsService.createOne({
				name,
				prefix,
				enabled: incoming.enabled !== false,
				description: incoming.description ?? '',
				endpoints: (incoming.endpoints ?? []).map(endpointPayload),
			});

			const created = await trx(ENDPOINTS).select('id', 'method', 'path', 'query').where({ collection: id });

			for (const endpoint of incoming.endpoints ?? []) {
				const match = created.find((row) => endpointKey(row) === endpointKey(endpoint));
				if (match) await setActiveResponse(match.id, endpoint.active_response);
			}
		}

		for (const step of plan.collections) {
			const incoming = file.collections.find((c) => trimSlashes(c.prefix) === step.prefix)!;
			const existing = local.find((c) => c.prefix === step.prefix);

			if (step.action === 'create') {
				await createCollection(incoming, step.targetPrefix, incoming.name);
			}
			else if (step.action === 'copy') {
				const suffix = step.targetPrefix.slice(step.prefix.length + 1);
				await createCollection(incoming, step.targetPrefix, `${incoming.name} (${suffix})`);
			}
			else if (step.action === 'replace' && existing) {
				await collectionsService.deleteOne(existing.id);
				await createCollection(incoming, step.targetPrefix, incoming.name);
			}
			else if (step.action === 'merge' && existing) {
				await collectionsService.updateOne(existing.id, {
					name: incoming.name,
					description: incoming.description ?? '',
				});

				for (const endpoint of incoming.endpoints ?? []) {
					const match = existing.endpoints.find((row) => endpointKey(row) === endpointKey(endpoint));
					const payload = endpointPayload(endpoint);
					let endpointId: number;

					if (match) {
						await endpointsService.updateOne(match.id, { active_response: null });
						await trx(RESPONSES).where({ endpoint: match.id }).delete();
						await endpointsService.updateOne(match.id, payload);
						endpointId = match.id;
					}
					else {
						endpointId = Number(await endpointsService.createOne({ ...payload, collection: existing.id }));
					}

					await setActiveResponse(endpointId, endpoint.active_response);
				}
			}
		}

		return plan;
	});
}
