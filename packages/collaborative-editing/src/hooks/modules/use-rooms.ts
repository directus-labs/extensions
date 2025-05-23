import * as Y from 'yjs';

export interface RoomUser {
	id: string;
	uid: string;
	color: string;
	userId: string;
}

export interface Room {
	name: string;
	fields: Map<string, string>;
	users: Map<string, RoomUser>;
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
			name: room,
			doc: new Y.Doc(),
			fields: new Map(),
			users: new Map(),
		});

		return this.get(room)!;
	}

	addUser(room: string, user: RoomUser) {
		(this.get(room) ?? this.add(room)).users.set(user.uid, user);
	}
	removeUser(room: string, socketUId: string) {
		(this.get(room) ?? this.add(room)).users.delete(socketUId);
	}
	addField(room: string, socketId: string, field: string) {
		(this.get(room) ?? this.add(room)).fields.set(socketId, field);
	}
	removeField(room: string, socketId: string) {
		(this.get(room) ?? this.add(room)).fields.delete(socketId);
	}

	updateDoc(room: string, update: Uint8Array) {
		const r = this.get(room) ?? this.add(room);
		Y.applyUpdate(r.doc, update);
	}
}

export function useRooms() {
	if (_state.rooms) return _state.rooms;

	_state.rooms = new RoomMap();

	return _state.rooms;
}
