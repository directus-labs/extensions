import type { SchemaOverview } from '@directus/types';
import type { EventEmitter } from 'events';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
export interface DirectusContext {
	services: any;
	database: Knex;
	env: Record<string, any>;
	logger: Logger;
	getSchema: (options?: { database?: Knex; bypassCache?: boolean }, attempt?: number) => Promise<SchemaOverview>;
	emitter: {
		filterEmitter: EventEmitter;
		actionEmitter: EventEmitter;
		initEmitter: EventEmitter;
	};
}
