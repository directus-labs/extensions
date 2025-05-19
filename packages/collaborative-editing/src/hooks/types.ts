/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accountability } from '@directus/types';
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
	database: any;
	env: Record<string, any>;
	logger: any;
	getSchema: (options?: any, attempt?: number) => Promise<any>;
};

export interface RealtimeSocket {
	client: RealtimeWebSocket;
	rooms: Set<string>;
	deleted?: boolean;
}
