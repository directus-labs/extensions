import { describe, expect, it } from 'vitest';
import { getReadableDisplayTemplate } from './get-readable-display-template';

const fieldsStore = { getField: () => ({}) };

describe('getReadableDisplayTemplate', () => {
	it('requests the file fields behind a $thumbnail and keeps the template', () => {
		expect(getReadableDisplayTemplate(fieldsStore, 'organizations', '{{logo.$thumbnail}} {{name}}', 'id')).toEqual({
			template: '{{logo.$thumbnail}} {{name}}',
			fields: ['logo.id', 'logo.type', 'logo.title', 'logo.modified_on', 'name'],
		});
	});

	it('drops thumbnail file fields the user cannot read', () => {
		const restricted = { getField: (_: string, field: string) => (field === 'logo.modified_on' ? null : {}) };

		expect(getReadableDisplayTemplate(restricted, 'organizations', '{{logo.$thumbnail}} {{name}}', 'id').fields).toEqual([
			'logo.id',
			'logo.type',
			'logo.title',
			'name',
		]);
	});

	it('falls back to the primary key when no thumbnail field is readable', () => {
		const restricted = { getField: (_: string, field: string) => (field.startsWith('logo.') ? null : {}) };

		expect(getReadableDisplayTemplate(restricted, 'organizations', '{{logo.$thumbnail}}', 'id')).toEqual({
			template: '{{id}}',
			fields: ['id'],
		});
	});

	it('handles a thumbnail on a file collection itself', () => {
		expect(getReadableDisplayTemplate(fieldsStore, 'directus_files', '{{$thumbnail}}', 'id').fields).toEqual([
			'id',
			'type',
			'title',
			'modified_on',
		]);
	});
});
