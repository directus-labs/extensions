import { describe, expect, test, vi } from 'vitest';
import { sanitizePayload } from './sanitize-payload';

import { SchemaBuilder } from '@directus/schema-builder';
import { DirectusWebsocket } from '../types';

function getServices() {
	const ItemsService = vi.fn();
	ItemsService.prototype.readOne = vi.fn((pk, { fields }: { fields: string[] }) => {
		// M2A
		if (fields.length === 2 && fields[0] === 'collection' && fields[1] === 'item') {
			return { collection: 'child', item: 999 };
		}

		return;
	});

	return {
		ItemsService,
	};
}

function getErrorServices(errorsOn: [field: string, s?: unknown][]) {
	const errorOn = new Map();

	for (const [fieldName, value] of errorsOn) {
		errorOn.set(fieldName, value);
	}

	const ItemsService = vi.fn();
	ItemsService.prototype.readOne = vi.fn((pk, { fields }: { fields: string[] }) => {
		const field = fields.find((f) => errorOn.has(f));

		// M2A
		if (fields.length === 2 && fields[0] === 'collection' && fields[1] === 'item') {
			return { collection: 'child', item: 999 };
		}

		if (!field) {
			return;
		}

		const fieldValue = errorOn.get(field);

		if (fieldValue === undefined || fieldValue == pk) {
			throw Error();
		}

		return;
	});

	return {
		ItemsService,
	};
}

const socket = { id: 'tester' } as DirectusWebsocket;

const database = vi.fn();

const schema = new SchemaBuilder()
	.collection('parents', (c) => {
		c.field('id').id();
		c.field('m2o_child').m2o('child');
		c.field('o2m_child').o2m('child', 'parent_id');
		c.field('builder_child').m2a(['child']);
	})
	.collection('child', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('slug').string();
	})
	.build();

describe('Create New returns no change', () => {
	test('M2O', async () => {
		const payload = {
			m2o_child: { title: 'The title', slug: 'The slug' },
		};

		const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toBe(null);
	});

	test('O2M', async () => {
		const payload = {
			o2m_child: {
				create: [{ title: 'The title', slug: 'The slug' }],
				update: [],
				delete: [],
			},
		};

		const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual({
			o2m_child: {
				create: [],
				delete: [],
				update: [],
			},
		});
	});

	test('M2A', async () => {
		const payload = {
			builder_child: {
				create: [
					{
						collection: 'child',
						item: { title: 'The title', slug: 'The slug' },
					},
				],
				update: [],
				delete: [],
			},
		};

		const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
			database,
			schema,
			services: getServices(),
		});

		expect(sanitizedPayload).toStrictEqual({
			builder_child: {
				create: [],
				delete: [],
				update: [],
			},
		});
	});
});

describe('Add Existing', () => {
	describe('Full permissions expects regular payload', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: 1,
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ parent_id: '1', id: 1 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [{ parents_id: '2', collection: 'child', item: { id: 3 } }],
					update: [],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			console.dir({ sanitizedPayload }, { depth: null });

			expect(sanitizedPayload).toStrictEqual(payload);
		});
	});

	describe('Excludes fields without permission', async () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: 2,
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['m2o_child']]),
			});

			expect(sanitizedPayload).toStrictEqual(null);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ parent_id: '1', id: 2 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 2]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				o2m_child: {
					create: [],
					update: [{ parent_id: '1' }],
					delete: [],
				},
			});
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [{ parents_id: '2', collection: 'child', item: { id: 3 } }],
					update: [],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 999]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				builder_child: {
					create: [{ collection: 'child', parents_id: '2' }],
					update: [],
					delete: [],
				},
			});
		});
	});

	describe('Excludes records without permission', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: 2,
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 2]]),
			});

			expect(sanitizedPayload).toStrictEqual(null);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ id: 2 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 2]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				o2m_child: {
					create: [],
					delete: [],
					update: [],
				},
			});
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [{ parents_id: '2', collection: 'child', item: { id: 999 } }],
					update: [],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['parents_id', 2], ['collection'], ['id', 999]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				builder_child: {
					create: [],
					delete: [],
					update: [],
				},
			});
		});
	});
});

describe('Update', () => {
	describe('Full permissions expects regular payload', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: {
					title: 'The title change 1',
					slug: 'The slug change 1',
					id: 1,
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [],
					update: [
						{
							collection: 'child',
							item: {
								title: 'The title change 1',
								slug: 'The slug change 1',
								id: 1,
							},
							id: 1,
						},
					],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});
	});

	describe('Excludes fields without permission', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: {
					title: 'The title change 1',
					slug: 'The slug change 1',
					id: 1,
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['slug']]),
			});

			expect(sanitizedPayload).toStrictEqual({
				m2o_child: {
					title: 'The title change 1',
					id: 1,
				},
			});
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['slug']]),
			});

			expect(sanitizedPayload).toStrictEqual({
				o2m_child: {
					create: [],
					update: [{ title: 'The title change 1', id: 1 }],
					delete: [],
				},
			});
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [],
					update: [
						{
							collection: 'child',
							item: {
								title: 'The title change 1',
								slug: 'The slug change 1',
								id: 2,
							},
							id: 1,
						},
					],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['slug']]),
			});

			expect(sanitizedPayload).toStrictEqual({
				builder_child: {
					create: [],
					update: [
						{
							collection: 'child',
							item: {
								title: 'The title change 1',
								id: 2,
							},
							id: 1,
						},
					],
					delete: [],
				},
			});
		});
	});

	describe('Excludes record without permission', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: {
					title: 'The title change 1',
					slug: 'The slug change 1',
					id: 1,
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['title'], ['slug'], ['id']]),
			});

			expect(sanitizedPayload).toStrictEqual(null);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [{ title: 'The title change 1', slug: 'The slug change 1', id: 1 }],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['title'], ['slug'], ['id']]),
			});

			expect(sanitizedPayload).toStrictEqual({
				o2m_child: {
					create: [],
					delete: [],
					update: [],
				},
			});
		});

		test('M2A', async () => {
			const payload = {
				builder_child: {
					create: [],
					update: [
						{
							collection: 'child',
							item: {
								title: 'The title change 1',
								slug: 'The slug change 1',
								id: 1,
							},
							id: 1,
						},
					],
					delete: [],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['item'], ['id'], ['collection']]),
			});

			expect(sanitizedPayload).toStrictEqual({
				builder_child: {
					create: [],
					delete: [],
					update: [],
				},
			});
		});
	});
});

describe('Delete', () => {
	describe('Full permissions expects regular payload', () => {
		test('M2O', async () => {
			const payload = {
				m2o_child: null,
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [],
					delete: [8],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});

		test('M2A', async () => {
			const payload = {
				builder_child: { create: [], update: [], delete: [2] },
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getServices(),
			});

			expect(sanitizedPayload).toStrictEqual(payload);
		});
	});

	describe('Excludes ids that are not allowed', () => {
		test('O2M', async () => {
			const payload = {
				o2m_child: {
					create: [],
					update: [],
					delete: [8, 9, 10],
				},
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 9]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				o2m_child: {
					create: [],
					update: [],
					delete: [8, 10],
				},
			});
		});

		test('M2A', async () => {
			const payload = {
				builder_child: { create: [], update: [], delete: [9] },
			};

			const sanitizedPayload = await sanitizePayload(socket, 'parents:1', payload, {
				database,
				schema,
				services: getErrorServices([['id', 9]]),
			});

			expect(sanitizedPayload).toStrictEqual({
				builder_child: { create: [], update: [], delete: [] },
			});
		});
	});
});
