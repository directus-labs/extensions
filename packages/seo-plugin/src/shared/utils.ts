/**
 * Utility functions for SEO analysis
 */

/**
 * Strips HTML tags from a string
 */
export function stripHtml(html: string): string {
	if (!html) return '';
	return html.replaceAll(/<[^>]*>/g, ' ').replaceAll(/\s+/g, ' ').trim();
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
		.replaceAll(/\[(.+?)\]\(.+?\)/g, '$1') // Links
		.replaceAll(/!\[(.+?)\]\(.+?\)/g, '$1') // Images
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
	return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Counts case-insensitive occurrences of a substring in a string
 */
export function countOccurrences(text: string, sub: string): number {
	if (!text || !sub) return 0;

	const normalizedText = text.toLowerCase();
	const normalizedSub = sub.toLowerCase();

	// Return 0 if the substring is empty
	if (normalizedSub.length === 0) return 0;

	let count = 0;
	let position = normalizedText.indexOf(normalizedSub);

	while (position !== -1) {
		count++;
		position = normalizedText.indexOf(normalizedSub, position + 1);
	}

	return count;
}

/**
 * Normalizes a slug for comparison
 */
export function normalizeSlug(slug: string): string {
	if (!slug) return '';
	return slug
		.toLowerCase()
		.replaceAll(/[^\w\s-]/g, '') // Remove special characters
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
	const imgRegex = /<img[^>]*alt=["']([^"']*)["'][^>]*>/gi;
	let match: RegExpExecArray | null;

	while ((match = imgRegex.exec(html)) !== null) {
		const altText = match[1];

		if (altText && altText.trim()) {
			altTexts.push(altText.trim());
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
	const htmlHeadingRegex = /<h([2-6])[^>]*>(.*?)<\/h\1>/gi;
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
