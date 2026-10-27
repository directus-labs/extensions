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

	it('handles a thumbnail on a file collection itself', () => {
		expect(getReadableDisplayTemplate(fieldsStore, 'directus_files', '{{$thumbnail}}', 'id').fields).toEqual([
			'id',
			'type',
			'title',
			'modified_on',
		]);
	});
});
