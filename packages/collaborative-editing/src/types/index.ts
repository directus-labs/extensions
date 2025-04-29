export interface User {
	id: string;
	color: string;
	first_name: string;
	last_name: string;
	avatar?: {
		id: string;
	};
}

export interface AwarenessState {
	user: User;
	activeField?: {
		field: string;
	};
}

export type AwarenessType = 'local-awareness' | 'global-awareness';

export interface Awareness {
	type: AwarenessType;
	sourceDocument: string;
	states: AwarenessState[];
}

export interface ActiveFieldItem {
	key: string;
	field: string;
	collection: string;
	id: string;
	user: User;
}

export interface HocuspocusProviderOptions {
	url: string;
	name: string;
	onAwarenessUpdate?: () => void;
	onStatus?: (data: { status: string }) => void;
}
