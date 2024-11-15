import { create, read, update, del, list } from './actions';
const endpoint = 'deals';
export const deals = {
	label: 'Deals',
	icon: 'handshake',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
