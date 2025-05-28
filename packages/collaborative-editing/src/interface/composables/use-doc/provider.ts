import { ObservableV2 } from 'lib0/observable';
import { Ref } from 'vue';
import * as Y from 'yjs';
import { UNDEFINED_VALUE } from '../../../shared/constants';
import {
	ActivateMessage,
	AwarenessUserAddPayload,
	AwarenessUserRemovePayload,
	UpdateMessage,
	WebsocketMessage,
	WebsocketMessagePayload,
} from '../../../shared/types/events';
import { ActiveField } from '../../types';
import { parseUpdate } from '../../utils/parse-update';
import { useColor } from '../use-color';
import { useWS } from '../use-ws';

interface DirectusProviderOptions {
	doc: Y.Doc;
}

interface DirectusProviderEvents {
	connected: () => void;
	disconnect: () => void;
	'field:activate': (uid: string, field: { field: ActiveField }) => void;
	'field:deactivate': (uid: string, field: { field: null }) => void;
	'user:add': (user: Omit<AwarenessUserAddPayload, 'event' | 'type' | 'action'>) => void;
	'user:remove': (user: Omit<AwarenessUserRemovePayload, 'event' | 'type' | 'action'>) => void;
	'doc:update': (field: string, value: unknown) => void;
	'doc:set': (field: string, value: unknown, origin: 'update' | 'sync' | 'form') => void;
	'item:save': (room: string) => void;
	debug: (event: string, ...data: unknown[]) => void;
}

export class DirectusProvider extends ObservableV2<DirectusProviderEvents> {
	ws: ReturnType<typeof useWS>;
	doc: Y.Doc;
	room: string | null;
	lastOrigin: 'form' | 'update' | 'sync' | null;
	public readonly connected: Ref<boolean>;
	constructor(opts: DirectusProviderOptions) {
		super();

		this.ws = useWS();

		this.lastOrigin = null;

		this.ws.onOpen(this.handleConnection.bind(this));
		this.ws.onMessage<WebsocketMessagePayload>(this.handleMessage.bind(this));

		this.doc = opts.doc;
		this.room = null;
		this.connected = this.ws.connected;

		this.registerHandlers();
	}

	private send(data: WebsocketMessage) {
		this.emit('debug', ['send', data]);

		if (!this.connected.value) {
			this.emit('debug', ['send:cancelled']);
			return;
		}

		const message =
			data.type === 'update' ? JSON.stringify(data, (_, v) => (v === undefined ? UNDEFINED_VALUE : v)) : data;

		this.ws.client.sendMessage(message);
	}

	connect() {
		this.ws.client.connect();
	}

	private registerHandlers() {
		// yjs local doc updates
		this.on('doc:set', this.handleDocumentUpdate.bind(this));
	}

	// remote -> local (update | sync): apply and emit but do not send
	// local -> remote (form) : apply and send but do not emit
	private handleDocumentUpdate(field: string, value: unknown, origin: 'update' | 'sync' | 'form') {
		this.emit('debug', ['doc:update', field, value, origin]);

		const lastOrigin = this.lastOrigin;
		this.lastOrigin = origin;

		if (this.room === null) {
			this.emit('debug', ['message:cancel', this.room]);
			return;
		}

		// CRDT
		const changeDoc = new Y.Doc();
		Y.applyUpdate(changeDoc, Y.encodeStateAsUpdate(this.doc));
		changeDoc.getMap(this.room).set(field, value);
		Y.applyUpdate(this.doc, Y.encodeStateAsUpdate(changeDoc));

		if (origin !== 'form') {
			const docMap = this.doc.getMap(this.room);

			this.emit('doc:update', [field, docMap.get(field)]);
		}

		// only send out updates from user entered data
		if (origin === 'form' && lastOrigin !== 'sync' && lastOrigin !== 'update') {
			const data: UpdateMessage = {
				type: 'update',
				room: this.room,
				update: { [field]: value },
			};

			this.emit('debug', ['doc:payload', data]);

			this.send(data);
		}
	}

	private handleMessage(message: WebsocketMessagePayload) {
		const payload = message.event === 'update' || message.event === 'sync' ? parseUpdate(message) : message;

		this.emit('debug', ['message:payload', payload]);

		if (payload.event === 'connected') {
			this.emit('connected', []);
		} else if (payload.event === 'update') {
			const update = payload.update;

			if (update) {
				for (const field of Object.keys(update)) {
					this.emit('doc:set', [field, update[field], 'update']);
				}
			}
		} else if (payload.event === 'save') {
			this.emit('item:save', [payload.room]);
		} else if (payload.event === 'awareness') {
			// Handle user awareness
			if (payload.type === 'user') {
				if (payload.action === 'add') {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { action, event, type, ...user } = payload;

					this.emit('user:add', [user]);
				} else {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { action, event, type, ...user } = payload;
					this.emit('user:remove', [user]);
				}
			} else if (payload.type === 'field') {
				if (payload.action === 'add') {
					this.emit('field:activate', [
						payload.uid,
						{
							field: {
								uid: payload.uid,
								field: payload.field,
								collection: payload.collection,
								primaryKey: payload.primaryKey,
							},
						},
					]);
				} else {
					this.emit('field:deactivate', [payload.uid, { field: null }]);
				}
			}
		} else if (payload.event === 'sync') {
			// Apply initial state
			if (payload.state) {
				const state = payload.state;

				for (const field of Object.keys(state)) {
					setTimeout(() => {
						this.emit('doc:set', [field, state[field], 'sync']);
					}, 1);
				}
			}

			// Add all existing users
			for (const user of payload.users) {
				this.emit('user:add', [user]);
			}

			// Set all active fields
			for (const field of payload.fields) {
				this.emit('field:activate', [
					field.uid,
					{
						field: {
							uid: field.uid,
							field: field.field,
							collection: field.collection,
							primaryKey: field.primaryKey,
						},
					},
				]);
			}
		}
	}

	private handleConnection() {
		this.emit('debug', ['connect', this.room]);

		// indicate this connection is for yjs
		this.send({
			type: 'realtime-connect',
			color: useColor().value,
			rooms: Array.from(this.ws.rooms.value),
		});

		this.emit('connected', []);
	}

	activateField(field: Omit<ActivateMessage, 'type' | 'room'>) {
		if (!this.room) return;
		this.send({
			type: 'activate',
			...field,
			room: this.room,
		});
	}

	deactivateField() {
		if (!this.room) return;
		this.send({
			type: 'deactivate',
			room: this.room,
		});
	}

	join(room: string) {
		if (this.room === null) {
			this.send({
				type: 'join',
				room: room,
			});

			this.ws.rooms.value.add(room);
			this.room = room;
		}
	}

	leave() {
		if (!this.room) return;

		this.send({
			type: 'leave',
			room: this.room,
		});

		this.ws.rooms.value.delete(this.room);
		this.room = null;
	}
}
