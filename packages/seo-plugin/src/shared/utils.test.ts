// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
	countOccurrences,
	countWords,
	extractImageAltText,
	extractSubheadings,
	formatFilesize,
	nextRovingValue,
	normalizeContent,
	normalizeSlug,
	renderTemplate,
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

	it('matches Japanese, Chinese, and Korean keyphrases inside running text', () => {
		expect(countOccurrences('東京観光ガイドで東京を楽しむ', '東京')).toBe(2);
		expect(countOccurrences('上海旅游指南', '旅游')).toBe(1);
		expect(countOccurrences('서울 여행을 계획하세요', '여행')).toBe(1);
	});

	it('does not match inside words that use combining marks', () => {
		expect(countOccurrences('की', 'क')).toBe(0);
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

	it('treats underscores as separators', () => {
		expect(normalizeSlug('seo_guide')).toBe('seo-guide');
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

describe('renderTemplate', () => {
	const values = { title: 'Hello', author: { name: 'Ann' }, tags: ['a', 'b'], n: 0, nil: null };

	it('renders paths like micromustache did', () => {
		expect(renderTemplate('{{title}} | Acme', values)).toBe('Hello | Acme');
		expect(renderTemplate('{{ author.name }}', values)).toBe('Ann');
		expect(renderTemplate('{{tags[1]}} {{tags.0}}', values)).toBe('b a');
		expect(renderTemplate('{{n}}', values)).toBe('0');
		expect(renderTemplate(`{{ author["name"] }} {{ author['name'] }} {{ author[ "name" ] }}`, values)).toBe('Ann Ann Ann');
		expect(renderTemplate('{{ author["first.name"] }}', { author: { 'first.name': 'Bob' } })).toBe('Bob');
	});

	it('leaves a malformed template as typed', () => {
		expect(renderTemplate('{{ title', values)).toBe('{{ title');
	});

	it('renders missing and null values as empty', () => {
		expect(renderTemplate('{{nil}}{{missing}}{{ missing.deep }}', values)).toBe('');
	});
});

describe('countWords', () => {
	it('counts words in spaced languages', () => {
		expect(countWords('one two  three')).toBe(3);
	});

	it('counts words in languages written without spaces', () => {
		expect(countWords('私は東京に住んでいます')).toBeGreaterThan(3);
	});
});

describe('nextRovingValue', () => {
	const values = ['a', 'b', 'c'];

	it('wraps with arrow keys and jumps with Home/End', () => {
		expect(nextRovingValue('ArrowRight', values, 'c')).toBe('a');
		expect(nextRovingValue('ArrowLeft', values, 'a')).toBe('c');
		expect(nextRovingValue('Home', values, 'b')).toBe('a');
		expect(nextRovingValue('End', values, 'a')).toBe('c');
	});

	it('ignores other keys', () => {
		expect(nextRovingValue('Enter', values, 'a')).toBeUndefined();
	});
});

describe('formatFilesize', () => {
	it('formats bytes like the Directus file details', () => {
		expect(formatFilesize(65_348)).toBe('65.3 kB');
		expect(formatFilesize(1_000_000)).toBe('1.0 MB');
		expect(formatFilesize(512)).toBe('512 B');
		expect(formatFilesize(0)).toBe('--');
	});
});
