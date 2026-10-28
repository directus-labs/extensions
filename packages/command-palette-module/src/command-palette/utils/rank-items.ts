import { commandScore } from './command-score';

export interface RankInput {
	value: string;
	keywords?: string[];
	priority?: number;
}

export interface RankedItem<T> {
	item: T;
	score: number;
}

export function getRankScore({ value, keywords = [], priority = 0 }: RankInput, search: string) {
	const score = commandScore(value, search, keywords);
	if (score <= 0.1) return 0;

	return score + priority * 0.01;
}

// Fuzzy-filters and sorts by score, best first. Ties keep their original order, and an empty search keeps everything.
export function rankItems<T>(items: readonly T[], search: string, toInput: (item: T) => RankInput): RankedItem<T>[] {
	if (!search) return items.map((item) => ({ item, score: 1 }));

	return items
		.map((item) => ({ item, score: getRankScore(toInput(item), search) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score);
}
