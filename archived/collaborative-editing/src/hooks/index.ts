import { defineHook } from '@directus/extensions-sdk';
import { generateRealtimeInterface } from '../shared/field/generate-realtime-interface';
import { realtimeInterfaceExists } from '../shared/field/realtime-interface-exists';
import { ServerEvent } from '../shared/types/events';
import { BROADCAST_CHANNEL } from './constants';
import {
	handleActivate,
	handleClose,
	handleConnect,
	handleDeactivate,
	handleJoin,
	handleLeave,
	handleSaveCommitted,
	handleSaveConfirm,
	handleSaveConfirmed,
	handleUpdate,
} from './handlers';
import { handleBroadcast, useBus } from './lib/bus';
import { useSockets } from './lib/use-sockets';
import { BroadcastPayload } from './types';

const excludedFromLogs = ['update', 'pong'] as const;

export default defineHook(async ({ action, filter }, ctx) => {
	const { env, services, database, getSchema } = ctx;

	const sockets = useSockets();
	const bus = useBus(env);

	let realtimeEnabled = false;

	try {
		const schema = await getSchema();

		const realtimeSettings = (await new services.SettingsService({ knex: database, schema }).readSingleton({
			fields: ['collaborative_editing_settings'],
		})) as { collaborative_editing_settings: { enabled_globally?: boolean; collections?: string[] } };

		realtimeEnabled = realtimeSettings.collaborative_editing_settings.enabled_globally ?? false;
	} catch {
		// ignore
	}

	action('websocket.message', async ({ message, client }, eventCtx) => {
		if (!client.accountability?.user) return;
		if (message.type !== 'realtime-connect' && sockets.has(client.uid) === false) return;

		// Only log message types that are not 'update' or 'pong'
		if (env.REALTIME_LOGS_ENABLED && !excludedFromLogs.includes(message.type)) {
			ctx.logger.info(`[realtime:message] Client ${client.uid} sent message ${message.type}`);
		}

		const { type, ...payload } = message;
		const messageCtx = { ...ctx, database: eventCtx.database };

		switch (type as ServerEvent) {
			case 'realtime-connect':
				handleConnect(client, payload);
				break;
			case 'update':
				handleUpdate(client, payload, messageCtx);
				break;
			case 'activate':
				handleActivate(client, payload, messageCtx);
				break;
			case 'deactivate':
				handleDeactivate(client, payload, messageCtx);
				break;
			case 'join':
				handleJoin(client, payload, messageCtx);
				break;
			case 'leave':
				handleLeave(client, payload, messageCtx);
				break;
			case 'save:confirm':
				handleSaveConfirm(client, payload, messageCtx);
				break;
			case 'save:confirmed':
				handleSaveConfirmed(client, payload, messageCtx);
				break;
		}
	});

	bus.subscribe(BROADCAST_CHANNEL, (payload: BroadcastPayload) => {
		handleBroadcast(payload, ctx);
	});

	action('items.update', (meta, eventCtx) => {
		if (eventCtx.accountability?.user) {
			handleSaveCommitted(meta, { ...ctx, database: eventCtx.database });
		}
	});

	action('websocket.close', ({ client }, eventCtx) => {
		handleClose(client, { ...ctx, database: eventCtx.database });
	});

	action('settings.update', (payload) => {
		if ('collaborative_editing_settings' in payload && 'realtime_enabled' in payload.collaborative_editing_settings) {
			realtimeEnabled = payload.collaborative_editing_settings.realtime_enabled;
		}
	});

	filter('collections.create', async (payload, _, eventCtx) => {
		if (!realtimeEnabled) return;

		const { collection } = payload as Record<string, unknown> & { collection?: string };

		if (!collection) return;

		const fieldsItemService = new services.ItemsService('directus_fields', {
			schema: eventCtx.schema,
			knex: eventCtx.database,
		});

		// We must query for existing fields as they have yet to be added to the schema
		const collectionFields = await fieldsItemService.readByQuery({
			filter: { collection: { _eq: collection } },
		});

		// Assumed to be folder if no fields
		if (collectionFields.length === 0 || realtimeInterfaceExists(collectionFields)) return;

		const { field, meta } = generateRealtimeInterface(collection);

		await fieldsItemService.createOne({
			collection,
			field,
			...meta,
		});
	});
});
