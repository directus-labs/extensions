import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPath } from '../shared/utils';
import messages from './index';

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const file = path.join(dir, name);
		if (file === __dirname) return [];
		if (statSync(file).isDirectory()) return sourceFiles(file);
		return /\.(?:ts|vue)$/.test(name) && !name.includes('.test.') ? [file] : [];
	});
}

function leafKeys(tree: object, prefix = ''): string[] {
	return Object.entries(tree).flatMap(([key, value]) =>
		typeof value === 'string' ? [`${prefix}${key}`] : leafKeys(value, `${prefix}${key}.`),
	);
}

function placeholders(text: string): string[] {
	return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!))].sort();
}

// Called with a count, so translations may use vue-i18n plural forms (`one | many`)
const PLURAL_KEYS = new Set([
	'seo_plugin.analysis.details.occurrences',
	'seo_plugin.analysis.details.images_found',
	'seo_plugin.analysis.details.images_found_good',
	'seo_plugin.analysis.details.subheadings_found',
]);

const english = messages.find((locale) => locale.language === 'en-US')!.translation;

describe('translations', () => {
	const usedKeys = new Set(
		sourceFiles(path.join(__dirname, '..')).flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/'(seo_plugin\.[\w.]+)'/g)].map((match) => match[1]!),
		),
	);

	// Only finds keys written as single-quoted literals, so build keys that way
	it('finds keys in the source', () => {
		expect(usedKeys.size).toBeGreaterThan(0);
	});

	it.each([...usedKeys])('has an English string for %s', (key) => {
		expect(typeof getPath(english, key)).toBe('string');
	});

	it('has no unused English strings', () => {
		expect(leafKeys(english).filter((key) => !usedKeys.has(key))).toEqual([]);
	});

	describe.each(messages.filter((locale) => locale.language !== 'en-US'))('$language', ({ translation }) => {
		it('only uses keys that exist in English', () => {
			expect(leafKeys(translation).filter((key) => typeof getPath(english, key) !== 'string')).toEqual([]);
		});

		it('keeps the same placeholders as English', () => {
			const mismatched = leafKeys(translation).filter(
				(key) => placeholders(getPath(translation, key) as string).join(',') !== placeholders(getPath(english, key) as string).join(','),
			);

			expect(mismatched).toEqual([]);
		});

		it('does not use vue-i18n special characters', () => {
			// `@` starts linked messages, `|` splits plural forms
			const invalid = leafKeys(translation).filter((key) => {
				const text = getPath(translation, key) as string;
				return text.includes('@') || (text.includes('|') && !PLURAL_KEYS.has(key));
			});

			expect(invalid).toEqual([]);
		});
	});
});
