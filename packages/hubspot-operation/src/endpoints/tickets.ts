import { create, read, update, del, list } from './actions';
const endpoint = 'tickets';
export const tickets = {
	label: 'Ticket',
	icon: 'support_agent',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
