import * as Y from 'yjs';

export interface Room {
	fields: Map<string, string>;
	users: Set<string>;
	doc: Y.Doc;
}

const _state: { rooms: RoomMap | undefined } = {
	rooms: undefined,
};

class RoomMap extends Map<string, Room> {
	constructor() {
		super();
	}

	add(room: string) {
		this.set(room, {
			doc: new Y.Doc(),
			fields: new Map(),
			users: new Set(),
		});

		return this.get(room)!;
	}

	addUser(room: string, socketUId: string) {
		const r = this.get(room);
		if (r) {
			r.users.add(socketUId);
		}
	}
	removeUser(room: string, socketUId: string) {
		const r = this.get(room);
		if (r) {
			r.users.delete(socketUId);
		}
	}
	addField(room: string, sockerId: string, field: string) {
		const r = this.get(room);
		if (r) {
			r.fields.set(sockerId, field);
		}
	}
	removeField(room: string, sockerId: string) {
		const r = this.get(room);
		if (r) {
			r.fields.delete(sockerId);
		}
	}

	updateDoc(room: string, update: Uint8Array) {
		const r = this.get(room);
		if (r) {
			Y.applyUpdate(r.doc, update);
		}
	}
}

export function useRooms() {
	if (_state.rooms) return _state.rooms;

	_state.rooms = new RoomMap();

	return _state.rooms;
}
