import { create, read, update, del, list } from './actions';
const endpoint = 'contacts';
export const contacts = {
	label: 'Contacts',
	icon: 'person',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};