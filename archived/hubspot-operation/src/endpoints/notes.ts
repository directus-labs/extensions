import { create, del, list, read, update } from './actions';

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
