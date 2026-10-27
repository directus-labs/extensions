import { describe, expect, it } from 'vitest';
import { mergeFilters } from './merge-filters';

describe('mergeFilters', () => {
	it('defaults to A when B is null', () => {
		const A = {};
		expect(mergeFilters(A, null)).toEqual(A);
	});

	it('defaults to B when A is null', () => {
		const B = {};
		expect(mergeFilters(null, B)).toEqual(B);
	});

	it('merges with an _and by default', () => {
		const A = { a: { _eq: 1 } };
		const B = { b: { _eq: 2 } };

		expect(mergeFilters(A, B)).toStrictEqual({ _and: [A, B] });
	});

	it('allows merging on _or with a parameter', () => {
		const A = { a: { _eq: 1 } };
		const B = { b: { _eq: 2 } };

		expect(mergeFilters(A, B, 'or')).toStrictEqual({ _or: [A, B] });
	});
});
