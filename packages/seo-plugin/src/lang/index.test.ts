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
	return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

const english = messages.find((locale) => locale.language === 'en-US')!.translation;

describe('translations', () => {
	const usedKeys = new Set(
		sourceFiles(path.join(__dirname, '..')).flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/'(seo_plugin\.[\w.]+)'/g)].map((match) => match[1]!),
		),
	);

	it('finds keys in the source', () => {
		expect(usedKeys.size).toBeGreaterThan(50);
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
			// `|` splits plurals and `@` starts linked messages
			expect(leafKeys(translation).filter((key) => /[|@]/.test(getPath(translation, key) as string))).toEqual([]);
		});
	});
});
