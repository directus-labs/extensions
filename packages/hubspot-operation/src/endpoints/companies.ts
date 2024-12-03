import { create, read, update, del, list } from './actions';
const endpoint = 'companies';
export const companies = {
	label: 'Companies',
	icon: 'domain',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
