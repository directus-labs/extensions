<script setup lang="ts">
import { toArray } from '@directus/utils';
import { remove as removeDiacritics } from 'diacritics';
import { computed } from 'vue';

interface HighlightPart {
	text: string;
	highlighted: boolean;
}

type Match = [start: number, end: number];

interface Props {
	query?: string | string[] | null;
	text?: string;
}

const props = withDefaults(defineProps<Props>(), {
	query: null,
	text: '',
});

const parts = computed<HighlightPart[]>(() => {
	const normalizedText = removeDiacritics(props.text).toLowerCase();
	const matches = toArray(props.query).flatMap((query): Match[] => {
		if (!query) return [];

		const normalizedQuery = removeDiacritics(query).toLowerCase();
		const indices: Match[] = [];
		let index = normalizedText.indexOf(normalizedQuery);

		while (index !== -1) {
			const end = index + normalizedQuery.length;
			indices.push([index, end]);
			index = normalizedText.indexOf(normalizedQuery, index + 1);
		}

		return indices;
	});

	matches.sort(([startA, endA], [startB, endB]) => startA - startB || endA - endB);

	const firstMatch = matches[0];
	if (!firstMatch) return [{ highlighted: false, text: props.text }];

	const mergedMatches: Match[] = [];
	let [currentStart, currentEnd] = firstMatch;

	for (const [start, end] of matches.slice(1)) {
		if (start >= currentEnd) {
			mergedMatches.push([currentStart, currentEnd]);
			currentStart = start;
			currentEnd = end;
		}
		else if (end > currentEnd) {
			currentEnd = end;
		}
	}

	mergedMatches.push([currentStart, currentEnd]);

	const result: HighlightPart[] = [];

	for (const [index, [start, end]] of mergedMatches.entries()) {
		const precedingText = props.text
			.slice(0, start)
			.split(' ')
			.slice(-3)
			.join(' ')
			.trim();
		const followingText = props.text
			.slice(end)
			.split(' ')
			.slice(0, 3)
			.join(' ')
			.trim();
		const highlightedText = props.text.slice(start, end).trim();

		if (index > 0) result.push({ highlighted: false, text: '...' });

		if (precedingText) {
			result.push({
				highlighted: false,
				text: (precedingText.endsWith(' ') ? '...' : '... ') + precedingText,
			});
		}
		else if (start > 0) {
			result.push({ highlighted: false, text: '...' });
		}

		result.push({ highlighted: true, text: highlightedText });

		if (followingText) {
			result.push({
				highlighted: false,
				text: end + followingText.length < normalizedText.length
					? followingText + (followingText.startsWith(' ') ? '...' : ' ...')
					: followingText,
			});
		}
		else if (end < normalizedText.length) {
			result.push({ highlighted: false, text: '...' });
		}
	}

	return result;
});
</script>

<template>
	<span class="v-highlight">
		<template v-for="(part, index) in parts" :key="index">
			<mark v-if="part.highlighted" class="highlight">{{ part.text }}</mark>
			<template v-else>{{ part.text }}</template>
		</template>
	</span>
</template>

<style scoped>
mark {
	color: var(--theme--primary);
	background-color: transparent;
}
</style>
