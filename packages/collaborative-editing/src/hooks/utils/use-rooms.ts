import * as Y from 'yjs';

export interface Room {
	fields: Map<string, string>;
	users: Map<string, string>;
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
			users: new Map(),
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

	function addUser(room: string, user: string, color: string) {
		const r = rooms.get(room);
		if (r) {
			r.users.set(user, color);
		}
	}
	function removeUser(room: string, user: string) {
		const r = rooms.get(room);
		if (r) {
			r.users.delete(user);
		}
	}
	function addField(room: string, user: string, field: string) {
		const r = rooms.get(room);
		if (r) {
			r.fields.set(user, field);
		}
	}
	function removeField(room: string, user: string) {
		const r = rooms.get(room);
		if (r) {
			r.fields.delete(user);
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
