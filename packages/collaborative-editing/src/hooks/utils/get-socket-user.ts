import { Accountability, SchemaOverview } from '@directus/types';
import { Context, RealtimeWebSocket } from '../types';

export async function getSockerUser(
	socket: RealtimeWebSocket,
	ctx: Pick<Context, 'database' | 'services'> & { schema: SchemaOverview; accountability: Accountability },
) {
	const { accountability, services, database: knex, schema } = ctx;

	let user = {
		uid: socket.id,
		color: socket.color,
	};

	try {
		const dbUser = await new services.UsersService({
			knex,
			accountability,
			schema,
		}).readOne(socket.accountability.user, {
			fields: ['id', 'first_name', 'last_name', 'avatar'],
		});

		user = { ...user, ...dbUser };
	} catch {
		console.log(`User awareness payload set to anonymous, no permission to access ${socket.accountability.user}`);
	}

	return user;
}
