import { render } from 'micromustache';

/**
 * Utility functions for SEO analysis
 */

/**
 * Strips HTML tags from a string
 */
export function stripHtml(html: string): string {
	if (!html) return '';
	return decodeEntities(html.replaceAll(/<[^>]*>/g, ' ')).replaceAll(/\s+/g, ' ').trim();
}

/**
 * Decodes HTML entities. Older WYSIWYG output stores accents as named entities (`&eacute;`).
 */
function decodeEntities(text: string): string {
	if (!text.includes('&') || typeof DOMParser === 'undefined') return text;
	return new DOMParser().parseFromString(text, 'text/html').documentElement.textContent ?? text;
}

/**
 * Strips basic Markdown syntax from a string
 */
export function stripMarkdown(md: string): string {
	if (!md) return '';
	return md
		.replaceAll(/\*\*(.+?)\*\*/g, '$1') // Bold
		.replaceAll(/\*(.+?)\*/g, '$1') // Italic
		.replaceAll(/__(.+?)__/g, '$1') // Bold
		.replaceAll(/_(.+?)_/g, '$1') // Italic
		.replaceAll(/```(.+?)```/g, '$1') // Code blocks
		.replaceAll(/`(.+?)`/g, '$1') // Inline code
		.replaceAll(/!\[(.+?)\]\(.+?\)/g, '$1') // Images
		.replaceAll(/\[(.+?)\]\(.+?\)/g, '$1') // Links
		.replaceAll(/#{1,6}\s+(.+)/g, '$1') // Headings
		.replaceAll(/\n+/g, ' ') // Newlines
		.replaceAll(/\s+/g, ' ')
		.trim();
}

/**
 * Normalizes content by stripping HTML and Markdown
 */
export function normalizeContent(content: string): string {
	if (!content) return '';
	return stripMarkdown(stripHtml(content));
}

/**
 * Counts words in a string
 */
export function countWords(text: string): number {
	if (!text) return 0;

	// Segmenter handles languages written without spaces (Japanese, Chinese)
	if (typeof Intl.Segmenter === 'function') {
		return [...new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)].filter((segment) => segment.isWordLike).length;
	}

	return text.split(/\s+/).filter(Boolean).length;
}

// Scripts written without spaces between words, or with particles attached to words (Korean)
const NO_WORD_BOUNDARY_SCRIPTS = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/u;

/**
 * Counts case-insensitive, whole-word occurrences of a phrase in a string
 */
export function countOccurrences(text: string, phrase: string): number {
	if (!text || !phrase) return 0;

	const normalizedPhrase = phrase.normalize('NFC').trim();
	if (!normalizedPhrase) return 0;

	const escaped = normalizedPhrase.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
	// Lookarounds instead of \b, which only understands ASCII letters
	const pattern = NO_WORD_BOUNDARY_SCRIPTS.test(normalizedPhrase)
		? new RegExp(escaped, 'giu')
		: new RegExp(String.raw`(?<![\p{L}\p{M}\p{N}])${escaped}(?![\p{L}\p{M}\p{N}])`, 'giu');

	return text.normalize('NFC').match(pattern)?.length ?? 0;
}

export function containsPhrase(text: string | undefined | null, phrase: string): boolean {
	return countOccurrences(text ?? '', phrase) > 0;
}

/**
 * Normalizes a slug for comparison
 */
export function normalizeSlug(slug: string): string {
	if (slug === null || slug === undefined || slug === '') return '';
	return String(slug)
		.normalize('NFD')
		.replaceAll(/\p{M}/gu, '') // Fold accents, slugs are usually written without them
		.toLowerCase()
		.replaceAll(/[^\p{L}\p{N}\s_-]/gu, '') // Remove special characters
		.replaceAll(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
		.replaceAll(/-+/g, '-'); // Remove duplicate hyphens
}

/**
 * Calculates keyword density as a percentage
 */
export function calculateDensity(text: string, keyword: string): number {
	const wordCount = countWords(text);
	if (wordCount === 0 || !keyword) return 0;

	const keywordCount = countOccurrences(text, keyword);
	return (keywordCount / wordCount) * 100;
}

/**
 * Extracts all alt text attributes from HTML img tags
 */
export function extractImageAltText(html: string): string[] {
	if (!html) return [];

	const altTexts: string[] = [];
	const imgRegex = /<img\s[^>]*?\balt=(?:"([^"]*)"|'([^']*)')/gi;
	let match: RegExpExecArray | null;

	while ((match = imgRegex.exec(html)) !== null) {
		const altText = stripHtml(match[1] ?? match[2] ?? '');

		if (altText) {
			altTexts.push(altText);
		}
	}

	// Also extract from Markdown images
	const mdImgRegex = /!\[([^\]]+)\]\([^)]+\)/g;

	while ((match = mdImgRegex.exec(html)) !== null) {
		const altText = match[1];

		if (altText && altText.trim()) {
			altTexts.push(altText.trim());
		}
	}

	return altTexts;
}

/**
 * Extracts subheadings from HTML and Markdown content
 */
export function extractSubheadings(content: string): string[] {
	if (!content) return [];

	const subheadings: string[] = [];

	// Extract HTML headings h2-h6
	const htmlHeadingRegex = /<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
	let match: RegExpExecArray | null;

	while ((match = htmlHeadingRegex.exec(content)) !== null) {
		const headingText = stripHtml(match[2] || '');

		if (headingText) {
			subheadings.push(headingText);
		}
	}

	// Extract Markdown headings (## to ######)
	const mdHeadingRegex = /^#{2,6}\s+(\S.*)$/gm;

	while ((match = mdHeadingRegex.exec(content)) !== null) {
		const headingText = match[1];

		if (headingText && headingText.trim()) {
			subheadings.push(headingText.trim());
		}
	}

	return subheadings;
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(text: string | undefined | null, maxLength: number): string {
	if (!text) return '';
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * Reads a dot or bracket path (`author.name`, `tags[0]`) from an object
 */
export function getPath(source: unknown, path: string): unknown {
	return path
		.split(/[.[\]]/)
		.filter(Boolean)
		.reduce<any>((value, key) => value?.[key], source);
}

/**
 * Replaces `{{ path }}` placeholders with values. Missing and null values render empty.
 */
export function renderTemplate(template: string, values: Record<string, unknown>): string {
	try {
		return render(template, values);
	}
	catch {
		// Malformed template (e.g. an unclosed tag): leave it as typed
		return template;
	}
}

/**
 * How required custom SEO fields decide "not filled in". `false` and `0` count as filled.
 */
export function isEmptyValue(value: unknown): boolean {
	return value === undefined || value === null || value === '';
}

/**
 * Next value for arrow-key navigation in a tablist or radiogroup, or undefined for other keys.
 */
export function nextRovingValue<T>(key: string, values: T[], current: T): T | undefined {
	const index = values.indexOf(current);

	switch (key) {
		case 'ArrowRight':
		case 'ArrowDown':
			return values[(index + 1) % values.length];
		case 'ArrowLeft':
		case 'ArrowUp':
			return values[(index - 1 + values.length) % values.length];
		case 'Home':
			return values[0];
		case 'End':
			return values.at(-1);
		default:
			return undefined;
	}
}

/**
 * Same output as core's app/src/utils/format-filesize.ts (decimal units)
 */
export function formatFilesize(bytes = 0): string {
	if (!bytes) return '--';
	if (Math.abs(bytes) < 1000) return `${bytes} B`;

	const units = ['kB', 'MB', 'GB', 'TB'];
	let unitIndex = -1;
	let remaining = bytes;

	do {
		remaining /= 1000;
		unitIndex += 1;
	} while (Math.abs(remaining) >= 1000 && unitIndex < units.length - 1);

	return `${remaining.toFixed(1)} ${units[unitIndex]}`;
}
