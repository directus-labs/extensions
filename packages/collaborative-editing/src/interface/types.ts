// theme prefix for css variables
export const themePrefix = '--collab-' as const;

export type AwarenessColor = 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'red';

export type AwarenessThemeColorMap = {
	[key in AwarenessColor]: `${typeof themePrefix}${key}`;
};

export type AwarenessFieldType = 'text' | 'text-area' | 'wysiwyg' | 'select' | 'multi-select' | 'toggle';

export interface AwarenessUser {
	uid: string;
	id?: string | null | undefined;
	first_name?: string | null | undefined;
	last_name?: string | null | undefined;
	avatar?: string | null | undefined;
	color: AwarenessColor;
	isCurrentUser: boolean;
	rooms: Set<string>; // Changed from optional string to required Set
}

export interface ActiveField {
	uid: string;
	collection: string;
	field: string;
	primaryKey: string;
	interface?: string;
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
