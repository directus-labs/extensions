/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accountability, EventContext } from '@directus/types';
import { AwarenessColor } from '../interface/types';

export type DirectusWebSocket = {
	uid: string;
	accountability: Accountability;
	expires_at: number | null;
	refresh_token?: string;
} & WebSocket;

export interface RealtimeWebSocket extends DirectusWebSocket {
	id: string;
	color: AwarenessColor;
}

export type Context = {
	services: any;
	database: EventContext['database'];
	env: Record<string, any>;
	logger: any;
	getSchema: (options?: any, attempt?: number) => Promise<any>;
};

export interface RealtimeSocket {
	client: RealtimeWebSocket;
	rooms: Set<string>;
}

export type BroadcastType =
	| 'update'
	| 'awareness-user'
	| 'awareness-field'
	| 'room-doc'
	| 'save:confirm'
	| 'save:confirmed'
	| 'save:committed';

export interface BaseBroadcastPayload {
	type: BroadcastType;
	room: string;
}

export interface BroadcastSaveConfirmPayload extends BaseBroadcastPayload {
	type: 'save:confirm';
	originId: string;
	data: {
		savedAt: number;
	};
}

export interface BroadcastSaveConfirmedPayload extends BaseBroadcastPayload {
	type: 'save:confirmed';
	originId: string;
	data: {
		id: string;
	};
}

export interface BroadcastSaveCommittedPayload extends BaseBroadcastPayload {
	type: 'save:committed';
}

export interface BroadcastRoomDocPayload extends BaseBroadcastPayload {
	type: 'room-doc';
	originUid: string;
	data: Record<string, unknown> | null;
}

export interface BroadcastUpdatePayload extends BaseBroadcastPayload {
	type: 'update';
	originUid: string;
	data: Record<string, unknown> | null;
}

export interface BroadcastAwarenessUserAddPayload extends BaseBroadcastPayload {
	type: 'awareness-user';
	action: 'add';
	userId: string;
	data: {
		id: string;
		uid: string;
		color: AwarenessColor;
	};
}

export interface BroadcastAwarenessUserRemovePayload extends BaseBroadcastPayload {
	type: 'awareness-user';
	action: 'remove';
	originId: string;
	data: {
		id: string;
		uid: string;
	};
}

export interface BroadcastAwarenessFieldAddPayload extends BaseBroadcastPayload {
	type: 'awareness-field';
	action: 'add';
	data: {
		id: string;
		field: string;
		collection: string;
		primaryKey: string;
	};
}

export interface BroadcastAwarenessFieldRemovePayload extends BaseBroadcastPayload {
	type: 'awareness-field';
	action: 'remove';
	data: {
		id: string;
	};
}

export type BroadcastPayload =
	| BroadcastAwarenessUserAddPayload
	| BroadcastAwarenessFieldAddPayload
	| BroadcastRoomDocPayload
	| BroadcastSaveConfirmPayload
	| BroadcastSaveConfirmedPayload
	| BroadcastSaveCommittedPayload
	| BroadcastAwarenessFieldRemovePayload
	| BroadcastAwarenessUserRemovePayload
	| BroadcastUpdatePayload;

export type BroadcastContext = Context;
