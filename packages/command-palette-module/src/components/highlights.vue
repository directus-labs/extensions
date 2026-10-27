<script setup lang="ts">
import { remove as removeDiacritics } from 'diacritics';
import { computed } from 'vue';
import { toArray } from '../utils/to-array';

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

// Long texts can match thousands of times. Only a few snippets fit on the line, so stop there, and don't scan past a
// few words of context around each match.
const MAX_SNIPPETS = 10;
const CONTEXT_WORDS = 3;
const MAX_CONTEXT_LENGTH = 200;

const parts = computed<HighlightPart[]>(() => {
	const { normalizedText, starts, ends } = normalize(props.text);
	const matches = toArray(props.query).flatMap((query): Match[] => {
		if (!query) return [];

		const normalizedQuery = removeDiacritics(query).toLowerCase();
		if (!normalizedQuery) return [];

		const indices: Match[] = [];
		let index = normalizedText.indexOf(normalizedQuery);

		while (index !== -1) {
			const end = index + normalizedQuery.length;
			indices.push([starts[index]!, ends[end - 1]!]);
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
	let previousEnd = 0;
	let previousContextEnd = -1;

	for (const [start, end] of mergedMatches.slice(0, MAX_SNIPPETS)) {
		// Keep the whitespace touching the match, so "the release" doesn't render as "therelease".
		const precedingText = getPrecedingWords(props.text, start).trimStart();

		// Matches whose context overlaps share one snippet, so the text between them isn't repeated.
		if (start - precedingText.length <= previousContextEnd) {
			result.push({ highlighted: false, text: props.text.slice(previousEnd, start) });
		}
		else {
			if (result.length > 0) {
				pushFollowingText(result, previousEnd);
				// The previous snippet already ends with an ellipsis.
				result.push({ highlighted: false, text: ` ${precedingText}` });
			}
			else if (precedingText.trim()) {
				result.push({
					highlighted: false,
					text: (start > precedingText.length ? '... ' : '') + precedingText,
				});
			}
			else if (start > 0) {
				result.push({ highlighted: false, text: '...' });
			}
		}

		result.push({ highlighted: true, text: props.text.slice(start, end) });
		previousEnd = end;
		previousContextEnd = end + getFollowingWords(props.text, end).trimEnd().length;
	}

	pushFollowingText(result, previousEnd);

	return result;
});

function pushFollowingText(result: HighlightPart[], end: number) {
	const followingText = getFollowingWords(props.text, end).trimEnd();

	if (followingText.trim()) {
		result.push({
			highlighted: false,
			text: end + followingText.length < props.text.length ? `${followingText} ...` : followingText,
		});
	}
	else if (end < props.text.length) {
		result.push({ highlighted: false, text: '...' });
	}
}

function getPrecedingWords(text: string, start: number) {
	let limit = Math.max(0, start - MAX_CONTEXT_LENGTH);
	if (isLowSurrogate(text, limit)) limit++;
	let index = start;

	for (let word = 0; word < CONTEXT_WORDS; word++) {
		index = index > limit ? text.lastIndexOf(' ', index - 1) : -1;
		if (index < limit) return text.slice(limit, start);
	}

	return text.slice(index + 1, start);
}

function getFollowingWords(text: string, end: number) {
	let limit = Math.min(text.length, end + MAX_CONTEXT_LENGTH);
	if (isLowSurrogate(text, limit)) limit--;
	let index = end - 1;

	for (let word = 0; word < CONTEXT_WORDS; word++) {
		index = text.indexOf(' ', index + 1);
		if (index === -1 || index >= limit) return text.slice(end, limit);
	}

	return text.slice(end, index);
}

// The context cutoffs count UTF-16 units, so keep them from splitting an emoji or other surrogate pair.
function isLowSurrogate(text: string, index: number) {
	const code = text.codePointAt(index) ?? 0;
	return code >= 0xDC_00 && code <= 0xDF_FF;
}

// Characters like "æ" or "ß" expand when normalized, so keep each normalized char's span in the original text.
function normalize(text: string) {
	let normalizedText = '';
	const starts: number[] = [];
	const ends: number[] = [];
	let offset = 0;

	for (const char of text) {
		const normalizedChar = removeDiacritics(char).toLowerCase();
		normalizedText += normalizedChar;

		for (let index = 0; index < normalizedChar.length; index++) {
			starts.push(offset);
			ends.push(offset + char.length);
		}

		offset += char.length;
	}

	return { normalizedText, starts, ends };
}
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
