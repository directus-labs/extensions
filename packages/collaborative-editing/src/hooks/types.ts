/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accountability } from '@directus/types';

export type YJSEvent = 'yjs-connect' | 'update' | 'join' | 'leave';

export type WebsocketMessage = {
	type: YJSEvent;
	[key: string]: unknown;
};

export type DirectusWebsocketBase = {
	uid: string;
	accountability: Accountability | null;
	expires_at: number | null;
	refresh_token?: string;
	rooms: Set<string>;
};

export type Context = {
	services: any;
	database: any;
	env: Record<string, any>;
	logger: any;
	getSchema: (options?: any, attempt?: number) => Promise<any>;
};

export type DirectusWebsocket = WebSocket & DirectusWebsocketBase;
