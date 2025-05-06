export interface AwarenessUser {
	uid: string;
	id?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	avatar?: string | null;
	color: string;
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
