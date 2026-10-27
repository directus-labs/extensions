import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPath } from '../shared/utils';
import messages from './index';

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const file = path.join(dir, name);
		if (statSync(file).isDirectory()) return sourceFiles(file);
		return /\.(?:ts|vue)$/.test(name) && !name.includes('.test.') && file !== path.join(__dirname, 'index.ts') ? [file] : [];
	});
}

describe('translations', () => {
	const english = messages.find((locale) => locale.language === 'en-US')!.translation;

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
});
