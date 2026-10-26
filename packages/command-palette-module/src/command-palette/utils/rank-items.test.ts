import { describe, expect, it } from 'vitest';
import { getRankScore, rankItems } from './rank-items';

const items = [
	{ value: 'Go to File Library', keywords: ['files', 'library', 'media'] },
	{ value: 'Flows' },
	{ value: 'Settings', keywords: ['admin'] },
	{ value: 'Run Collection Ping', keywords: ['context'], priority: 0 },
];

function rank(search: string) {
	return rankItems(items, search, (item) => item).map(({ item }) => item.value);
}

describe('rankItems', () => {
	it('keeps everything in order when the search is empty', () => {
		expect(rank('')).toEqual(items.map(({ value }) => value));
	});

	it('drops weak matches and puts the best match first', () => {
		expect(rank('fl')).toEqual(['Flows', 'Go to File Library']);
		expect(rank('zzz')).toEqual([]);
	});

	it('matches on keywords', () => {
		expect(rank('admin')).toEqual(['Settings']);
	});

	it('keeps the original order on ties', () => {
		expect(rankItems(['a', 'a', 'a'].map((value, index) => ({ value, index })), 'a', (item) => item).map(({ item }) => item.index))
			.toEqual([0, 1, 2]);
	});
});

describe('getRankScore', () => {
	it('adds priority as a small boost', () => {
		const base = getRankScore({ value: 'Flows' }, 'fl');
		expect(getRankScore({ value: 'Flows', priority: 10 }, 'fl')).toBeCloseTo(base + 0.1);
	});

	it('ignores priority on scores at or below the cutoff', () => {
		expect(getRankScore({ value: 'Settings', priority: 100 }, 'zzz')).toBe(0);
	});
});
