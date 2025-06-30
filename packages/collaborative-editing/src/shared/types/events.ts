import { AwarenessColor } from '../../interface/types';

export type ClientEvent =
	| 'update'
	| 'awareness'
	| 'sync'
	| 'ping'
	| 'connected'
	| 'save:commit'
	| 'save:confirm'
	| 'save:committed';

export type DirectusServerEvent = 'pong';

export type RealtimeServerEvent =
	| 'realtime-connect'
	| 'update'
	| 'join'
	| 'leave'
	| 'activate'
	| 'deactivate'
	| 'save:confirmed'
	| 'save:confirm';

export type ServerEvent = DirectusServerEvent | RealtimeServerEvent;

export type WebsocketBaseMessage = {
	type: ServerEvent;
};

export interface ConnectMessage extends WebsocketBaseMessage {
	type: 'realtime-connect';
	color: AwarenessColor;
	rooms: string[] | null;
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
	update: Record<string, unknown>;
}

export interface ActivateMessage extends WebsocketBaseMessage {
	type: 'activate';
	field: string;
	collection: string;
	primaryKey: string;
	room: string;
}

export interface DeactivateMessage extends WebsocketBaseMessage {
	type: 'deactivate';
	room: string;
}

export interface SaveConfirmedMessage extends WebsocketBaseMessage {
	type: 'save:confirmed';
	room: string;
	id: string;
}

export interface SaveConfirmMessage extends WebsocketBaseMessage {
	type: 'save:confirm';
	room: string;
	savedAt: number;
}

export type WebsocketMessage =
	| ConnectMessage
	| PongMessage
	| JoinMessage
	| LeaveMessage
	| UpdateMessage
	| ActivateMessage
	| DeactivateMessage
	| SaveConfirmedMessage
	| SaveConfirmMessage;

export type WebsocketBaseMessagePayload = {
	event: ClientEvent;
};

export interface ConnectPayload extends WebsocketBaseMessagePayload {
	event: 'connected';
}

export interface SyncPayload extends WebsocketBaseMessagePayload {
	event: 'sync';
	room: string;
	state: Record<string, unknown> | null;
	users: Omit<AwarenessUserAddPayload, 'event' | 'type' | 'action'>[];
	fields: Omit<AwarenessFieldActivatePayload, 'event' | 'type' | 'action'>[];
}

export interface UpdatePayload extends WebsocketBaseMessagePayload {
	event: 'update';
	update: Record<string, unknown> | null;
	room: string;
}

export interface AwarenessFieldActivatePayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'field';
	action: 'add';
	field: string;
	uid: string;
	collection: string;
	primaryKey: string;
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
	color: AwarenessColor;
	room: string;
}

export interface AwarenessUserRemovePayload extends WebsocketBaseMessagePayload {
	event: 'awareness';
	type: 'user';
	action: 'remove';
	uid: string;
	room: string;
}

export interface SaveCommitPayload extends WebsocketBaseMessagePayload {
	event: 'save:commit';
	room: string;
}

export interface SaveConfirmPayload extends WebsocketBaseMessagePayload {
	event: 'save:confirm';
	room: string;
	savedAt: number;
	id: string;
}

export interface SaveCommittedPayload extends WebsocketBaseMessagePayload {
	event: 'save:committed';
	room: string;
}

export type WebsocketMessagePayload =
	| ConnectPayload
	| SyncPayload
	| SaveCommitPayload
	| SaveConfirmPayload
	| SaveCommittedPayload
	| UpdatePayload
	| AwarenessFieldActivatePayload
	| AwarenessFieldDeactivatePayload
	| AwarenessUserRemovePayload
	| AwarenessUserAddPayload;
