/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accountability } from '@directus/types';

export type ServerEvent = 'yjs-connect' | 'update' | 'join' | 'leave' | 'activate' | 'deactivate' | 'pong';

export type DirectusWebsocketBase = {
	uid: string;
	accountability: Accountability;
	expires_at: number | null;
	refresh_token?: string;
};

export interface DirectusCollaborativeWebsocket extends DirectusWebsocketBase {
	id: string;
	rooms: Set<string>;
	color: string;
}

export type Context = {
	services: any;
	database: any;
	env: Record<string, any>;
	logger: any;
	getSchema: (options?: any, attempt?: number) => Promise<any>;
};

export type DirectusWebsocket = WebSocket & DirectusCollaborativeWebsocket;
