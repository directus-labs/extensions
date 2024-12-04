import { create, read, update, del, list } from './actions';
const endpoint = 'tasks';
export const tasks = {
	label: 'Tasks',
	icon: 'check_box',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};