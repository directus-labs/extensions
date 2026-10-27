// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
	countOccurrences,
	extractImageAltText,
	extractSubheadings,
	normalizeContent,
	normalizeSlug,
	stripHtml,
	stripMarkdown,
} from './utils';

describe('stripHtml', () => {
	it('decodes named entities from older WYSIWYG output', () => {
		expect(stripHtml('<strong>tra&ccedil;abilit&eacute;</strong>')).toBe('traçabilité');
	});

	it('decodes numeric entities and nbsp', () => {
		expect(stripHtml('caf&#233;&nbsp;cr&#xE8;me')).toBe('café crème');
	});
});

describe('stripMarkdown', () => {
	it('keeps image alt text instead of leaving a stray "!"', () => {
		expect(stripMarkdown('![alt text](image.png)')).toBe('alt text');
	});
});

describe('countOccurrences', () => {
	it('matches whole words only', () => {
		expect(countOccurrences('seoul is not about seo', 'seo')).toBe(1);
	});

	it('matches accented keyphrases in entity-encoded content', () => {
		const content = normalizeContent('<p>La tra&ccedil;abilit&eacute; compte. Tra&ccedil;abilit&eacute;!</p>');
		expect(countOccurrences(content, 'traçabilité')).toBe(2);
	});

	it('matches precomposed and decomposed accents', () => {
		expect(countOccurrences('café', 'café')).toBe(1);
	});

	it('escapes regex characters in the keyphrase', () => {
		expect(countOccurrences('learn c++ today', 'c++')).toBe(1);
	});
});

describe('normalizeSlug', () => {
	it('folds accents and keeps non-Latin letters', () => {
		expect(normalizeSlug('Café Crème')).toBe('cafe-creme');
		expect(normalizeSlug('東京 案内')).toBe('東京-案内');
	});

	it('handles non-string input', () => {
		expect(normalizeSlug(42 as unknown as string)).toBe('42');
	});
});

describe('extractImageAltText', () => {
	it('reads alt text that contains the other quote character', () => {
		expect(extractImageAltText(`<img src="a.png" alt="Bob's photo">`)).toEqual(["Bob's photo"]);
	});
});

describe('extractSubheadings', () => {
	it('reads headings that span multiple lines', () => {
		expect(extractSubheadings('<h2>\n  Multi line\n</h2>')).toEqual(['Multi line']);
	});
});
