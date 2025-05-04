import { buffer } from 'lib0';
import { ObservableV2 } from 'lib0/observable';
import * as l from 'lodash-es';
import { computed, inject, unref, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as Y from 'yjs';
import { UseUserStackUser } from './use-avatar-stack';
import { useWSUrl } from './use-ws-url';

export interface UseYJSOptions {
	onFieldChange?(field: string, value: unknown): void;
}
export function useYJS(opts?: UseYJSOptions) {
	const doc = new Y.Doc();
	const route = useRoute();

	const formValues = inject<Record<string, unknown>>('values')!;
	const docMap = doc.getMap(route.params.collection as string);
	const room = computed(() => `${route.params.collection}:${route.params.primaryKey}`);
	const provider = new DirectusProvider({ serverUrl: useWSUrl(), room: unref(room), doc });

	// watch yjs doc changes and update formValue
	docMap.observe((event) => {
		const keys = event.keysChanged;

		for (const key of keys) {
			opts?.onFieldChange?.(key, docMap.get(key));
		}
	});

	// Watch for local changes
	if (formValues) {
		watch(
			formValues,
			(changedV, currentV) => {
				provider.emit('debug', ['formValues:raw', [changedV, currentV]]);
				if (!currentV || !changedV) return;
				if (l.isEqual(changedV, currentV)) return;

				for (const [key, current] of l.entries(currentV)) {
					const changeV = changedV[key];

					if (l.isEqual(current, changedV)) {
						continue;
					}

					if (changeV !== undefined && changeV !== null && key) {
						provider.emit('debug', ['docMap:set', [key, changeV]]);
						docMap.set(l.cloneDeep(key), l.cloneDeep(changeV));
					}
				}
			},
			{ deep: true },
		);
	}

	doc.on('update', (update) => {
		console.log('doc:update-', Y.decodeUpdate(update));
	});

	return provider;
}

interface DirectusProviderOptions {
	serverUrl: string;
	room: string;
	doc: Y.Doc;
}

interface DirectusProviderEvents {
	connected: () => void;
	'user:connect': (user: UseUserStackUser) => void;
	debug: (...args: unknown[]) => void;
}

interface DirectusWsMessage {
	type: string;
	[key: string]: unknown;
}

export class DirectusProvider extends ObservableV2<DirectusProviderEvents> {
	ws: WebSocket;
	doc: Y.Doc;
	room: string;
	constructor(opts: DirectusProviderOptions) {
		super();
		this.ws = new WebSocket(opts.serverUrl);
		this.doc = opts.doc;
		this.room = opts.room;

		this.registerHandlers();
	}

	private send(data: DirectusWsMessage) {
		this.emit('debug', ['send', data]);
		this.ws.send(JSON.stringify(data));
	}

	private registerHandlers() {
		// connect
		this.ws.addEventListener('open', () => {
			this.emit('debug', ['connect', this.room]);

			// indicate this connection is for yjs
			this.ws.send(
				JSON.stringify({
					type: 'yjs-connect',
					room: this.room,
				}),
			);

			this.emit('connected', []);
		});

		// receive broadcasts
		this.ws.addEventListener('message', this.handleMessage.bind(this));

		// yjs local doc updates
		this.doc.on('update', this.handleDocumentUpdate.bind(this));
	}

	private handleDocumentUpdate(update: Uint8Array, origin: unknown, _doc: Y.Doc, transaction: Y.Transaction) {
		if (origin === this.doc.clientID) {
			return;
		}

		const [collection, primaryKey] = this.room?.split(':') ?? [];

		this.emit('debug', ['doc:update', Y.decodeUpdate(update), transaction]);

		const fields: string[] = [];

		transaction.changed.forEach((c) => {
			c.forEach((f) => {
				if (!f) return;
				fields.push(f);
			});
		});

		const data = {
			type: 'yjs-update',
			collection: collection ?? null,
			primaryKey: primaryKey ?? null,
			fields: fields,
			update: buffer.toBase64(update),
		};

		this.emit('debug', ['doc:payload', data]);

		this.send(data);
	}

	private handleMessage(message: MessageEvent) {
		let data: DirectusWsMessage;
		try {
			data = JSON.parse(message.data);
		} catch {
			// don't process invalid payload
			return;
		}

		this.emit('debug', ['message:payload', data]);

		if (data.type === 'ping') {
			// heartbeat keepalive
			this.ws.send(JSON.stringify({ type: 'pong' }));
		} else if (data.type === 'update') {
			Y.applyUpdate(this.doc, buffer.fromBase64(data.update as string), this.doc.clientID);
		}
	}

	disconnect(): void {
		this.emit('debug', ['disconnect']);

		this.send({ type: 'yjs-awareness-user-disconnect' });
	}
}
