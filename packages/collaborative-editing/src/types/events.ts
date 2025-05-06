import { ServerEvent } from '../hooks/types';

export type ClientEvent = 'update' | 'awareness' | 'sync' | 'ping' | 'connected';

export type WebsocketBaseMessage = {
	type: ServerEvent;
};

export interface ConnectMessage extends WebsocketBaseMessage {
	type: 'yjs-connect';
	color: string;
}
export interface PongMessage extends WebsocketBaseMessage {
	type: 'pong';
}
export interface JoinMessage extends WebsocketBaseMessage {
	type: 'join';
	room: string;
}

export interface LeaveMessage extends WebsocketBaseMessage {
	type: 'leave';
	room: string;
}

export interface UpdateMessage extends WebsocketBaseMessage {
	type: 'update';
	room: string;
	field: string;
	update: string;
}

export interface ActivateMessage extends WebsocketBaseMessage {
	type: 'activate';
	field: string;
	room: string;
}

export interface DeactivateMessage extends WebsocketBaseMessage {
	type: 'deactivate';
	room: string;
}

export type WebsocketMessage =
	| ConnectMessage
	| PongMessage
	| JoinMessage
	| LeaveMessage
	| UpdateMessage
	| ActivateMessage
	| DeactivateMessage;

export type WebsocketBaseMessagePayload = {
	event: ClientEvent;
};

export interface PingPayload extends WebsocketBaseMessagePayload {
	event: 'ping';
}

export interface ConnectPayload extends WebsocketBaseMessagePayload {
	event: 'connected';
}

export interface SyncPayload extends WebsocketBaseMessagePayload {
	event: 'sync';
	state: string;
	users: Omit<AwarenessUserAddPayload, 'event' | 'type' | 'action'>[];
	fields: Omit<AwarenessFieldActivatePayload, 'event' | 'type' | 'action'>[];
}

export interface UpdatePayload extends WebsocketBaseMessagePayload {
	event: 'update';
	update: string;
}

export interface AwarenessFieldActivatePayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'field';
	action: 'add';
	field: string;
	uid: string;
}

export interface AwarenessFieldDeactivatePayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'field';
	action: 'remove';
	uid: string;
}

export interface AwarenessUserAddPayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'user';
	action: 'add';
	uid: string;
	id?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	avatar?: string | null;
	color: string;
}

export interface AwarenessUserRemovePayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'user';
	action: 'remove';
	uid: string;
}

export type WebsocketMessagePayload =
	| PingPayload
	| ConnectPayload
	| SyncPayload
	| UpdatePayload
	| AwarenessFieldActivatePayload
	| AwarenessFieldDeactivatePayload
	| AwarenessUserRemovePayload
	| AwarenessUserAddPayload;
