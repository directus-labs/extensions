import type { AwarenessUserAddPayload, JoinMessage } from '../../types/events';
import type { Context, DirectusWebsocket } from '../types';
import { useDocs } from '../utils/use-docs';
import { useSockets } from '../utils/use-sockets';

export async function handleJoin(client: DirectusWebsocket, message: JoinMessage, ctx: Context) {
	const docs = useDocs();
	const sockets = useSockets();
	const schema = await ctx.getSchema();

	console.log(`added room: ${message.room}`);
	client.rooms.add(message.room);

	if (docs.has(message.room) === false) {
		console.log(`created doc for room ${message.room}`);
		docs.add(message.room);
	}

	for (const socket of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(message.room) === false) continue;

		const usersService = new ctx.services.UsersService({
			knex: ctx.database,
			accountability: socket.accountability,
			schema,
		});

		let payload: AwarenessUserAddPayload = {
			event: 'awareness',
			type: 'user',
			action: 'add',
			uid: client.uid,
			color: client.color,
		};
		try {
			const dbUser = await usersService.readOne(client.accountability?.user, {
				fields: ['id', 'first_name', 'last_name', 'avatar'],
			});

			payload = {
				...payload,
				...dbUser,
			};
		} catch {
			// console.error(e);
			console.log(`Skipping awareness payload update, no permission to access ${client.accountability?.user}`);
			// error = no permission
			continue;
		}

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}
