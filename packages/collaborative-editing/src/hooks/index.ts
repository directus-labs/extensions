import { defineHook } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import * as _l from 'lodash-es';
import * as Y from 'yjs';

export type DirectusWebsocketBase = {
	uid: string;
};
export type AuthenticationState = {
	accountability: Accountability | null;
	expires_at: number | null;
	refresh_token?: string;
};

export type CollaborationState = {
	room: string;
};

type DirectusWebsocket = WebSocket & DirectusWebsocketBase & AuthenticationState & CollaborationState;

const clientSet = new Set<DirectusWebsocket>();

export default defineHook(async ({ action }, { services, database, getSchema }) => {
	const schema = await getSchema();

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability) return;

		console.log('uid', client.uid);
		console.log('event', message.type);
		console.log('client-room', client.room);
		console.log('room', message.room);

		if (message.type === 'yjs-connect') {
			// add room directly on client
			client.room = message.room;

			clientSet.add(client);

			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				// ensure accountability has not been wiped
				if (!socket.accountability) {
					continue;
				}

				const usersService = new services.UsersService({
					knex: database,
					accountability: socket.accountability,
					schema,
				});

				let user = { uid: client.uid };
				try {
					const dbUser = await usersService.readOne(client.accountability?.user, {
						fields: ['id', 'first_name', 'last_name', 'avatar'],
					});

					user = {
						...user,
						...dbUser,
					};
				} catch (error) {
					console.log(error);
				}

				try {
					socket.send(JSON.stringify({ type: 'awareness-user-connect', user }));
				} catch (error) {
					console.log(error);
				}
			}
		} else if (message.type === 'yjs-update') {
			const rawUpdate = Y.decodeUpdate(Buffer.from(message.update, 'base64'));

			const field = _l.get(rawUpdate, ['structs', '0', 'parentSub'], null);
			const collection = message.collection;
			const primaryKey = message.primaryKey;

			console.dir({ field, collection, primaryKey, rawUpdate }, { depth: null });

			// if (!field || !collection || !primaryKey) {
			// 	return;
			// }

			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				console.log('sockets', socket.uid);
				// try {
				// 	await new services.ItemsService(collection, {
				// 		knex: database,
				// 		accountability: socket.accountability,
				// 		schema,
				// 	}).readOne(primaryKey, { field: [field] });
				// } catch (e) {
				// 	console.error(e);
				// 	// error = no permission
				// 	continue;
				// }

				console.log('===== sending ====');

				try {
					socket.send(JSON.stringify({ type: 'update', update: message.update }));
				} catch (error) {
					console.log(error);
				}
			}
		} else if (message.type === 'yjs-awareness-field-activated') {
			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				try {
					socket.send(
						JSON.stringify({
							type: 'awareness-field-activated',
							field: {
								name: message.field,
								collection: message.collection,
							},
						}),
					);
				} catch (error) {
					console.log(error);
				}
			}
		} else if (message.type === 'yjs-awareness-field-deactivated') {
			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				try {
					socket.send(
						JSON.stringify({
							type: 'awareness-field-deactivated',
							field: {
								name: message.field,
								collection: message.collection,
							},
						}),
					);
				} catch (error) {
					console.log(error);
				}
			}
		} else if (message.type === 'yjs-awareness-user-disconnect') {
			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				// cleanup
				clientSet.delete(client);

				try {
					socket.send(JSON.stringify({ type: 'awareness-user-disconnect', user: { uid: client.uid } }));
				} catch (error) {
					console.log(error);
				}
			}
		} else {
			return;
		}
	});

	action('websocket.close', ({ client }) => {
		clientSet.delete(client);
	});
});
