import { entries } from 'lodash-es';
import * as Y from 'yjs';
import { Context, DirectusWebsocket, WebsocketMessage } from '../types';
import { useDocs } from '../utils/use-docs';

export interface HandleSyncPayload extends WebsocketMessage {
	type: 'sync';
	room: string;
}

export async function handleSync(client: DirectusWebsocket, payload: HandleSyncPayload, ctx: Context) {
	console.log(`${client.uid} requesting sync`);

	const docs = useDocs();

	const doc = docs.get(payload.room);

	if (doc) {
		// remove forbidden fields
		const sync = new Y.Doc();

		const [collection, primaryKey] = payload.room.split(':');
		const updates = sync.getMap(payload.room);
		const schema = await ctx.getSchema();

		const currentFields = doc.getMap(payload.room).toJSON();
		for (const [field, value] of entries(currentFields)) {
			// permission check
			if (field && collection && primaryKey) {
				try {
					await new ctx.services.ItemsService(collection, {
						knex: ctx.database,
						accountability: client.accountability,
						schema,
					}).readOne(primaryKey, { fields: [field] });

					updates.set(field, value);
				} catch {
					// console.error(e);
					console.log(`excluding field ${field} from sync as client ${client.uid} has no permission`);
					// error = no permission
					continue;
				}
			}
		}

		console.log(`sent sync to client ${client.uid} for doc ${doc.clientID}`);
		client.send(JSON.stringify({ type: 'sync', update: Buffer.from(Y.encodeStateAsUpdate(sync)).toString('base64') }));
	}
}
