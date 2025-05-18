import { Item, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import { Context, RealtimeWebSocket } from '../types';
import { getRelationInfo } from './get-relation-info';

export async function sanitizePayload(
	socket: RealtimeWebSocket,
	room: string,
	payload: Record<string, unknown>,
	ctx: Pick<Context, 'database' | 'services'> & { schema: SchemaOverview },
) {
	const { services, database: knex, schema } = ctx;
	const [collection, primaryKey] = room.split(':');

	const sanitizedPayload: Record<string, unknown> = {};

	for (const field in payload) {
		if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;

		try {
			// Ensure they can read the field in the room, otherwise skip entire payload/processing
			await new services.ItemsService(collection, {
				knex,
				accountability: socket.accountability,
				schema,
			}).readOne(primaryKey, { fields: [field] });
		} catch {
			console.log(`[realtime:sanitize-payload] Skipped ${field} for ${socket.id} due to insufficient permissions`);
			continue;
		}

		const relation = getRelationInfo(schema.relations, collection, field);

		const value = payload[field];

		if (relation === null) {
			sanitizedPayload[field] = value;
		} else if (relation.type === 'm2a') {
			// M2A Update
			if (relation.collection && relation.payloadField) {
				let m2aCollection;

				try {
					// attempt to read the collection and PK of the record, it is not provided in the payload
					m2aCollection = await new services.ItemsService(collection, {
						knex,
						accountability: null,
						schema,
					}).readOne(primaryKey, { fields: [relation.collection, relation.payloadField] });
				} catch {
					continue;
				}

				if (m2aCollection) {
					const m2aSanitizedUpdatePayload = await sanitizePayload(
						socket,
						`${m2aCollection[relation.collection]}:${m2aCollection[relation.payloadField]}`,
						payload[relation.payloadField] as Record<string, unknown>,
						ctx,
					);

					if (m2aSanitizedUpdatePayload) {
						sanitizedPayload[field] = m2aSanitizedUpdatePayload;
					}
				}
			}
		} else if (relation.type === 'm2o') {
			const relatedPrimaryKey = schema.collections[relation.collection!].primary;

			const m2oPayload = value as number | string | bigint | Partial<Item> | null;

			// skip "Create New"
			if (isObject(m2oPayload) && !(relatedPrimaryKey in m2oPayload)) continue;

			if (['number', 'string', 'bigint'].includes(typeof m2oPayload)) {
				// "Add Existing"
				const m2oSanitizedExistingPayload = await sanitizePayload(
					socket,
					`${relation.collection}:${m2oPayload}`,
					{ [relatedPrimaryKey]: m2oPayload },
					ctx,
				);

				if (m2oSanitizedExistingPayload) {
					sanitizedPayload[field] = m2oSanitizedExistingPayload[relatedPrimaryKey];
				}
			} else if (isObject(m2oPayload)) {
				// Update Existing
				const m2oSanitizedUpdatePayload = await sanitizePayload(
					socket,
					`${relation.collection}:${m2oPayload[relatedPrimaryKey]}`,
					m2oPayload,
					ctx,
				);

				if (m2oSanitizedUpdatePayload) {
					sanitizedPayload[field] = m2oSanitizedUpdatePayload;
				}
			} else if (m2oPayload === null) {
				// Delete Existing
				sanitizedPayload[field] = m2oPayload;
			}
		} else if (relation.type === 'o2m') {
			// Will have object syntax field: { create:[]; update:[]; delete:[] }

			const o2mPayload = value as
				| { create: Partial<Item>[]; update: Partial<Item>[]; delete: number[] }
				| number[]
				| undefined
				| null;

			// Discard will send array of ids o2mPayload: [1,2,3] instead of object syntax
			if (Array.isArray(o2mPayload)) continue;

			// Undoing an action sends undefined
			if (o2mPayload === undefined || o2mPayload === null) {
				sanitizedPayload[field] = {
					create: [],
					update: [],
					delete: [],
				};

				continue;
			}

			const relatedPrimaryKey = schema.collections[relation.collection!].primary;

			const o2mSanitizedCreatePayloads: Partial<Item>[] = [];
			for (const create of o2mPayload.create) {
				// skip "Create New"
				if (!(relation.payloadField in create)) continue;

				// "Add Existing" for M2A/M2M
				const o2mSanitizedExistingPayload = await sanitizePayload(
					socket,
					`${relation.collection}:${create[relation.payloadField]}`,
					create,
					ctx,
				);

				if (o2mSanitizedExistingPayload) {
					o2mSanitizedCreatePayloads.push(o2mSanitizedExistingPayload);
				}
			}

			const o2mSanitizedUpdatePayloads: Partial<Item>[] = [];
			for (const update of o2mPayload.update) {
				// "Add Existing" for O2M and "Update" for O2M/M2A/M2M
				const updatePrimaryKey = update[relatedPrimaryKey] ? relatedPrimaryKey : relation.payloadField;

				const o2mSanitizedUpdatePayload = await sanitizePayload(
					socket,
					`${relation.collection}:${update[updatePrimaryKey]}`,
					update,
					ctx,
				);

				if (o2mSanitizedUpdatePayload) {
					o2mSanitizedUpdatePayloads.push(o2mSanitizedUpdatePayload);
				}
			}

			const o2mSanitizedDelPayloads: number[] = [];
			for (const del of o2mPayload.delete) {
				// Delete
				const o2mSanitizedDelPayload = await sanitizePayload(
					socket,
					`${relation.collection}:${del}`,
					{ [relatedPrimaryKey]: del },
					ctx,
				);

				if (o2mSanitizedDelPayload) {
					o2mSanitizedDelPayloads.push(o2mSanitizedDelPayload[relatedPrimaryKey] as number);
				}
			}

			sanitizedPayload[field] = {
				create: o2mSanitizedCreatePayloads,
				update: o2mSanitizedUpdatePayloads,
				delete: o2mSanitizedDelPayloads,
			};
		}
	}

	return Object.keys(sanitizedPayload).length > 0 ? sanitizedPayload : null;
}
