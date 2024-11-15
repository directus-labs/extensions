import { create, read, update, del, list } from './actions';
const endpoint = 'meetings';
export const meetings = {
	label: 'Meetings',
	icon: 'meeting_room',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};