import { Accountability, SchemaOverview } from '@directus/types';
import { Context } from '../types';

export async function getSocketUser(
	userId: string,
	ctx: Pick<Context, 'database' | 'services'> & { schema: SchemaOverview; accountability: Accountability },
) {
	const { accountability, services, database: knex, schema } = ctx;

	try {
		return new services.UsersService({
			knex,
			accountability,
			schema,
		}).readOne(userId, {
			fields: ['id', 'first_name', 'last_name', 'avatar'],
		});
	} catch {
		console.log(`User awareness payload set to anonymous, no permission to access ${userId}`);
	}

	return {};
}
