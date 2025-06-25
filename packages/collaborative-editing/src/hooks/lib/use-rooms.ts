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
	saves: Map<string, Set<string>>;
	doc: Y.Doc;
}

const cache: { rooms: RoomMap | undefined } = {
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
			saves: new Map(),
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

	clearDoc(room: string) {
		const r = this.get(room) ?? this.add(room);
		r.doc = new Y.Doc();
	}
}

export function useRooms() {
	if (cache.rooms) return cache.rooms;

	cache.rooms = new RoomMap();

	return cache.rooms;
}
