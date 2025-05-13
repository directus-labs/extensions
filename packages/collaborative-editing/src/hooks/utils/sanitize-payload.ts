import { Context, DirectusWebsocket } from '../types';

export async function sanitizePayload(
	socket: DirectusWebsocket,
	room: string,
	update: Record<string, unknown>,
	ctx: Pick<Context, 'database' | 'services'> & { schema: unknown },
) {
	const { services, database: knex, schema } = ctx;
	const [collection, primaryKey] = room.split(':');

	let hasUpdate = false;
	const sanitizedPayload: Record<string, unknown> = {};

	for (const field in update) {
		if (Object.prototype.hasOwnProperty.call(update, field)) {
			try {
				await new services.ItemsService(collection, {
					knex,
					accountability: socket.accountability,
					schema,
				}).readOne(primaryKey, { fields: [field] });

				sanitizedPayload[field] = update[field];
				console.log(`[realtime:sanitize-payload] Added ${field} to payload for ${socket.id}`);
				hasUpdate = true;
			} catch {
				console.log(`[realtime:sanitize-payload] Skipped ${field} for ${socket.id} due to insufficient permissions`);
			}
		}
	}

	return hasUpdate ? sanitizedPayload : null;
}
