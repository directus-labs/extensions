import { buffer } from 'lib0';
import { ObservableV2 } from 'lib0/observable';
import { Ref } from 'vue';
import * as Y from 'yjs';
import {
	ActivateMessage,
	AwarenessUserAddPayload,
	UpdateMessage,
	WebsocketMessage,
	WebsocketMessagePayload,
} from '../../../types/events';
import { ActiveField } from '../../types';
import { useColor } from '../use-color';
import { useWS } from './ws';

interface DirectusProviderOptions {
	doc: Y.Doc;
}

interface DirectusProviderEvents {
	connected: () => void;
	disconnect: () => void;
	'field:activate': (uid: string, field: { field: ActiveField }) => void;
	'field:deactivate': (uid: string, field: { field: null }) => void;
	'user:add': (user: Omit<AwarenessUserAddPayload, 'event' | 'type' | 'action'>) => void;
	'user:remove': (uid: string) => void;
	'doc:update': (field: string, value: unknown) => void;
	'doc:set': (field: string, value: unknown) => void;
	debug: (event: string, ...data: unknown[]) => void;
}

export class DirectusProvider extends ObservableV2<DirectusProviderEvents> {
	ws: ReturnType<typeof useWS>;
	doc: Y.Doc;
	room: string | null;
	public readonly connected: Ref<boolean>;
	constructor(opts: DirectusProviderOptions) {
		super();

		this.ws = useWS();

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

		this.ws.client.sendMessage(data);
	}

	connect() {
		this.ws.client.connect();
	}

	private registerHandlers() {
		// yjs local doc updates
		this.doc.on('update', this.handleDocumentUpdate.bind(this));
	}

	private handleDocumentUpdate(update: Uint8Array, origin: unknown, _doc: Y.Doc, transaction: Y.Transaction) {
		if (origin === this.doc.clientID) {
			return;
		}

		this.emit('debug', ['doc:update', Y.decodeUpdate(update), transaction]);

		if (this.room === null) {
			this.emit('debug', ['message:cancel', this.room]);
			return;
		}

		const fields: string[] = [];

		transaction.changed.forEach((c) => {
			c.forEach((f) => {
				if (!f) return;
				fields.push(f);
			});
		});

		const data: UpdateMessage = {
			type: 'update',
			room: this.room,
			field: fields[0],
			update: buffer.toBase64(update),
		};

		this.emit('debug', ['doc:payload', data]);

		this.send(data);
	}

	private handleMessage(payload: WebsocketMessagePayload) {
		this.emit('debug', ['message:payload', payload]);

		if (payload.event === 'ping') {
			// heartbeat keepalive
			this.send({ type: 'pong' });
		} else if (payload.event === 'connected') {
			this.emit('connected', []);
		} else if (payload.event === 'update') {
			Y.applyUpdate(this.doc, buffer.fromBase64(payload.update), this.doc.clientID);
		} else if (payload.event === 'awareness') {
			// Handle user awareness
			if (payload.type === 'user') {
				if (payload.action === 'add') {
					this.emit('user:add', [
						{
							uid: payload.uid,
							id: payload.id,
							first_name: payload.first_name,
							last_name: payload.last_name,
							avatar: payload.avatar,
							color: payload.color,
						},
					]);
				} else {
					this.emit('user:remove', [payload.uid]);
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
				Y.applyUpdate(this.doc, buffer.fromBase64(payload.state), this.doc.clientID);
			}

			// Add all existing users
			for (const user of payload.users) {
				this.emit('user:add', [
					{
						uid: user.uid,
						id: user.id,
						first_name: user.first_name,
						last_name: user.last_name,
						avatar: user.avatar,
						color: user.color,
					},
				]);
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
		this.send({ type: 'yjs-connect', color: useColor().value });

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
			// setup doc listener
			const docMap = this.doc.getMap(room);

			// watch yjs doc changes
			docMap.observe((event) => {
				const keys = event.keysChanged;

				for (const key of keys) {
					this.emit('doc:update', [key, docMap.get(key)]);
				}
			});

			this.on('doc:set', (key: string, value: unknown) => {
				docMap.set(key, value);
			});

			this.send({
				type: 'join',
				room: room,
			});

			this.room = room;
		}
	}

	leave() {
		if (!this.room) return;

		this.send({
			type: 'leave',
			room: this.room,
		});

		this.room = null;
	}
}
