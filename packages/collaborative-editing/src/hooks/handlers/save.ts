import { SavePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { isValidSocket } from '../utils/is-valid-socket';

interface HandleSaveMeta {
	event: string;
	payload: Record<string, unknown>;
	keys: (number | string)[];
	collection: string;
}

export async function handleSave(meta: Record<string, unknown>) {
	const sockets = useSockets();
	const rooms = useRooms();

	const { keys, collection } = meta as unknown as HandleSaveMeta;

	console.log(`[realtime:save] Event received for ${collection}`);

	for (const key of keys) {
		const roomName = `${collection}:${key}`;
		const room = rooms.get(roomName);

		if (!room) {
			continue;
		}

		// Emit the update to all current room clients
		for (const [, socket] of sockets) {
			if (!isValidSocket(socket) || socket.rooms.has(roomName) === false) {
				continue;
			}

			const payload: SavePayload = { event: 'save' };

			console.log(
				`[realtime:save] Event sent to user ${socket.client.accountability.user} with socket uid ${socket.client.uid}`,
			);

			try {
				socket.client.send(JSON.stringify(payload));
			} catch (error) {
				console.log(error);
			}
		}
	}
}
