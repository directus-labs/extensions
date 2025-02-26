import { create, del, list, read, update } from './actions';

const endpoint = 'email';

export const email = {
	label: 'Email',
	icon: 'mail',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
