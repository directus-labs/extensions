import { describe, expect, it } from 'vitest';
import { getFieldsFromTemplate } from './get-fields-from-template';

describe('getFieldsFromTemplate', () => {
	it('returns an empty array when no value passed', () => {
		expect(getFieldsFromTemplate('')).toStrictEqual([]);
		expect(getFieldsFromTemplate()).toStrictEqual([]);
		expect(getFieldsFromTemplate(null)).toStrictEqual([]);
	});

	it('returns fields as an array of strings', () => {
		expect(getFieldsFromTemplate('{{ field }}')).toStrictEqual(['field']);
		expect(getFieldsFromTemplate('{{ title }} by {{author.name}}')).toStrictEqual(['title', 'author.name']);
	});
});
