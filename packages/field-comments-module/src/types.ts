import type { Comment, User } from '@directus/types';

export interface CommentCollectionType {
	collection: string;
	field: string | number;
}

export interface Packet {
	collection_name: string;
	field_id: number;
	item_id: string | number;
}

export type Activity = Comment & {
	display: string;
	user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
};

export interface CommentsByDateDisplay {
	date: Date;
	dateFormatted: string;
	comments: Activity[];
}
