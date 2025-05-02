import { defineHook } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';

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
			const collection = message.collection;
			const primaryKey = message.primaryKey;
			const fields = message.fields;

			console.dir({ fields, collection, primaryKey }, { depth: null });

			for (const socket of clientSet) {
				if (client.uid === socket.uid || socket.room !== client.room) continue;

				// permission check
				if (fields.length > 0 && collection && primaryKey) {
					try {
						await new services.ItemsService(collection, {
							knex: database,
							accountability: socket.accountability,
							schema,
						}).readOne(primaryKey, { fields });
					} catch (e) {
						console.error(e);
						// error = no permission
						continue;
					}
				}

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

				const { field, collection, primaryKey } = message;

				// permission check
				if (field && collection && primaryKey) {
					try {
						await new services.ItemsService(collection, {
							knex: database,
							accountability: socket.accountability,
							schema,
						}).readOne(primaryKey, { fields: [field] });
					} catch (e) {
						console.error(e);
						// error = no permission
						continue;
					}
				}

				try {
					socket.send(
						JSON.stringify({
							type: 'awareness-field-activated',
							field: {
								field,
								collection,
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

				const { field, collection, primaryKey } = message;

				// permission check
				if (field && collection && primaryKey) {
					try {
						await new services.ItemsService(collection, {
							knex: database,
							accountability: socket.accountability,
							schema,
						}).readOne(primaryKey, { fields: [field] });
					} catch (e) {
						console.error(e);
						// error = no permission
						continue;
					}
				}

				try {
					socket.send(
						JSON.stringify({
							type: 'awareness-field-deactivated',
							field: {
								field,
								collection,
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
