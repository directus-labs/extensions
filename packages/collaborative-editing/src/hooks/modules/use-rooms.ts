import * as Y from 'yjs';

export interface Room {
	fields: Map<string, string>;
	users: Set<string>;
	doc: Y.Doc;
}

const _state: { rooms: ReturnType<typeof createRooms> | undefined } = {
	rooms: undefined,
};

function createRooms() {
	const rooms = new Map<string, Room>();

	function add(room: string) {
		rooms.set(room, {
			doc: new Y.Doc(),
			fields: new Map(),
			users: new Set(),
		});

		return rooms.get(room)!;
	}

	function remove(room: string) {
		return rooms.delete(room);
	}

	function get(room: string) {
		return rooms.get(room);
	}

	function has(room: string) {
		return rooms.has(room);
	}

	function addUser(room: string, socketUId: string) {
		const r = rooms.get(room);
		if (r) {
			r.users.add(socketUId);
		}
	}
	function removeUser(room: string, socketUId: string) {
		const r = rooms.get(room);
		if (r) {
			r.users.delete(socketUId);
		}
	}
	function addField(room: string, sockerId: string, field: string) {
		const r = rooms.get(room);
		if (r) {
			r.fields.set(sockerId, field);
		}
	}
	function removeField(room: string, sockerId: string) {
		const r = rooms.get(room);
		if (r) {
			r.fields.delete(sockerId);
		}
	}

	function updateDoc(room: string, update: Uint8Array) {
		const r = rooms.get(room);
		if (r) {
			Y.applyUpdate(r.doc, update);
		}
	}

	return { add, remove, get, has, updateDoc, removeUser, addUser, removeField, addField };
}

export function useRooms() {
	if (_state.rooms) return _state.rooms;

	_state.rooms = createRooms();

	return _state.rooms;
}
