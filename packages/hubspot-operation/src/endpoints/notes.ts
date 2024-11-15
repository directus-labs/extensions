import { create, read, update, del, list } from './actions';
const endpoint = 'notes';
export const notes = {
	label: 'Notes',
	icon: 'sticky_note_2',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};