import { create, del, list, read, update } from './actions';

const endpoint = 'products';

export const products = {
	label: 'Products',
	icon: 'shopping_bag',
	actions: {
		create: create(endpoint),
		retrieve: read(endpoint),
		update: update(endpoint),
		delete: del(endpoint),
		list: list(endpoint),
	},
};
