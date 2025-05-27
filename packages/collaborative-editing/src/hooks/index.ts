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
	handleSave,
	handleUpdate,
} from './handlers';
import { handleBroadcast, useBus } from './lib/bus';
import { useSockets } from './lib/use-sockets';
import { BroadcastPayload } from './types';

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

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability?.user) return;
		if (message.type !== 'realtime-connect' && sockets.has(client.uid) === false) return;

		console.log(`[realtime:message] Client ${client.uid} sent message ${message.type}`);

		const { type, ...payload } = message;

		switch (type as ServerEvent) {
			case 'realtime-connect':
				handleConnect(client, payload);
				break;
			case 'update':
				handleUpdate(client, payload, ctx);
				break;
			case 'activate':
				handleActivate(client, payload, ctx);
				break;
			case 'deactivate':
				handleDeactivate(client, payload, ctx);
				break;
			case 'join':
				handleJoin(client, payload, ctx);
				break;
			case 'leave':
				handleLeave(client, payload, ctx);
				break;
		}
	});

	bus.subscribe(BROADCAST_CHANNEL, (payload: BroadcastPayload) => {
		handleBroadcast(payload, ctx);
	});

	action('websocket.close', ({ client }) => {
		handleClose(client, ctx);
	});

	action('items.update', (meta) => {
		handleSave(meta, ctx);
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
