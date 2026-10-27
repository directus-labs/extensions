import { describe, expect, it } from 'vitest';
import { toArray } from './to-array';

describe('toArray', () => {
	it('returns the same array if already an array', () => {
		const input = [1, 2, 3];
		expect(toArray(input)).toBe(input);
	});

	it('wraps single values, including null and undefined', () => {
		const obj = { key: 'value' };
		expect(toArray(1)).toEqual([1]);
		expect(toArray(0)).toEqual([0]);
		expect(toArray(false)).toEqual([false]);
		expect(toArray(null)).toEqual([null]);
		// eslint-disable-next-line unicorn/no-useless-undefined
		expect(toArray(undefined)).toEqual([undefined]);
		expect(toArray(obj)).toEqual([obj]);
	});

	it('splits strings on commas without trimming', () => {
		expect(toArray('a,b,c')).toEqual(['a', 'b', 'c']);
		expect(toArray('a, b, c')).toEqual(['a', ' b', ' c']);
		expect(toArray('hello')).toEqual(['hello']);
		expect(toArray('')).toEqual(['']);
	});

	it('handles empty and mixed arrays', () => {
		const input = [1, 'two', { three: 3 }];
		expect(toArray([])).toEqual([]);
		expect(toArray(input)).toBe(input);
	});
});
