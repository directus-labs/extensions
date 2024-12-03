import { create, read, update, del, list } from './actions';
const endpoint = 'leads';
export const leads = {
	label: 'Leads',
	icon: 'ads_click',
	actions: {
        create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};