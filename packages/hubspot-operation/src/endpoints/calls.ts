import { create, del, list, read, update } from './actions';

const endpoint = 'calls';

export const calls = {
	label: 'Calls',
	icon: 'call',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
