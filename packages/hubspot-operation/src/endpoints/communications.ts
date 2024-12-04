import { create, read, update, del, list } from './actions';
const endpoint = 'communications';
export const communications = {
	label: 'Communications',
	icon: 'chat_bubble',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
