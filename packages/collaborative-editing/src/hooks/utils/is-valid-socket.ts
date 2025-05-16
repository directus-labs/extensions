import { DirectusWebsocket } from '../types';

export function isValidSocket(socket?: DirectusWebsocket): socket is DirectusWebsocket {
	if (!socket) return false;
	if (!socket.accountability?.user) return false;
	return true;
}
