import { describe, expect, test } from 'vitest';
import { UNDEFINED_VALUE } from '../../shared/constants';
import { parseUpdate } from './parse-update';

describe('Data Types', () => {
	test('KV with Array', async () => {
		const payload = {
			csv: [1, 2, 3],
		};

		expect(parseUpdate(payload)).toStrictEqual(payload);
	});

	describe('KV with Array', () => {
		test('primitive', async () => {
			const payload = {
				csv: [1, 2, 3],
			};

			expect(parseUpdate(payload)).toStrictEqual(payload);
		});

		test('undefined', async () => {
			const payload = {
				csv: [UNDEFINED_VALUE],
			};

			expect(parseUpdate(payload)).toStrictEqual({
				csv: [undefined],
			});
		});

		describe('object', () => {
			test('regular', async () => {
				const payload = {
					csv: [{ title: 'hello' }],
				};

				expect(parseUpdate(payload)).toStrictEqual(payload);
			});

			test('undefined', async () => {
				const payload = {
					csv: [{ title: UNDEFINED_VALUE }],
				};

				expect(parseUpdate(payload)).toStrictEqual({
					csv: [{ title: undefined }],
				});
			});
		});
	});

	describe('KV primitive', () => {
		test('regular', async () => {
			const payload = {
				input: 'The title',
				toggle: false,
				enabled: 0,
			};

			expect(parseUpdate(payload)).toStrictEqual(payload);
		});

		test('undefined', async () => {
			const payload = {
				input: UNDEFINED_VALUE,
			};

			expect(parseUpdate(payload)).toStrictEqual({ input: undefined });
		});
	});
});
