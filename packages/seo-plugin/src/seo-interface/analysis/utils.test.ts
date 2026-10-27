// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { analyzeContent, analyzeSlug, analyzeTitle } from './utils';

describe('analyzeSlug', () => {
	it('does not pass a non-Latin keyphrase that is missing from the slug', () => {
		expect(analyzeSlug({ focusKeyphrase: '東京', slug: 'osaka-guide' }).status).toBe('warning');
	});

	it('passes an accented keyphrase against an accent-free slug', () => {
		expect(analyzeSlug({ focusKeyphrase: 'traçabilité', slug: 'tracabilite-guide' }).status).toBe('good');
		expect(analyzeSlug({ focusKeyphrase: 'café', slug: 'best-café-in-town' }).status).toBe('good');
	});
});

describe('analyzeTitle', () => {
	it('matches the keyphrase as a whole word', () => {
		const result = analyzeTitle({ focusKeyphrase: 'seo', title: 'A travel guide to Seoul for first timers in 2026' });
		expect(result.details?.hasKeyphrase).toBe(false);
	});
});

describe('analyzeContent', () => {
	it('finds accented keyphrases in entity-encoded WYSIWYG content', () => {
		const words = Array.from({ length: 60 }, () => 'mot').join(' ');
		const content = `<p>La tra&ccedil;abilit&eacute; ${words}</p>`;
		expect(analyzeContent({ focusKeyphrase: 'traçabilité', combinedContent: content }).details?.occurrences).toBe(1);
	});
});
