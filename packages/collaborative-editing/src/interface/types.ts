export interface AwarenessUser {
	uid: string;
	id?: string | null;
	first_name?: string | null;
	last_name?: string | null;
	avatar?: string | null;
	color: string;
	isCurrentUser: boolean;
}

export interface ActiveField {
	uid: string;
	collection: string;
	field: string;
	primaryKey: string;
}

export interface AwarenessByUid {
	[uuid: string]: {
		user: AwarenessUser;
		activeField: ActiveField | null;
	};
}

export interface AwarenessItem {
	user: AwarenessUser;
	activeField: ActiveField | null;
}
