import type { Schema } from './types';

export default {
	create: {
		foo: 'foo',
		bar: 'bar',
	},
	update: {
		foo: 'bar',
		new_field: 'new value',
	},
	read: {
		offset: 0,
		limit: 20,
		fields: '*',
		filter: [['genres = horror', 'genres = comedy'], "director = 'Jordan Peele'"],
		retrieveVectors: false,
		ids: ['XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'],
	},
} as Schema;
