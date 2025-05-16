import { Socket } from '../modules/use-sockets';

export function isValidSocket(socket?: Socket): socket is Socket {
	if (!socket) return false;
	if (!socket.client.accountability?.user) return false;
	return true;
}
