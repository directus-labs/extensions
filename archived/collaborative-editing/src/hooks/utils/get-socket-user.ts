import { Accountability, SchemaOverview } from '@directus/types';
import { Context } from '../types';

export async function getSocketUser(
	userId: string,
	ctx: Pick<Context, 'database' | 'services'> & { schema: SchemaOverview; accountability: Accountability },
) {
	const { accountability, services, database: knex, schema } = ctx;

	try {
		const user = await new services.UsersService({
			knex,
			accountability,
			schema,
		}).readOne(userId, {
			fields: ['id', 'first_name', 'last_name', 'avatar'],
		});

		return user;
	} catch {
		// ignore
	}

	return {};
}
