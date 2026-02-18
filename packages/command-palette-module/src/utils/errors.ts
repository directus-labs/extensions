import type { FilterOperator, ValidationError } from '@directus/types';
import type { core, ZodError } from 'zod';

export function zodErrorToValidationErrors(
	error: ZodError,
	collection: string,
	group: string | null = null,
): ValidationError[] {
	return error.issues.map((issue: core.$ZodIssue): ValidationError => {
		const field = issue.path.join('.');
		let type: FilterOperator = 'eq'; // Default value, modify as necessary
		let valid: ValidationError['valid'];

		switch (issue.code) {
			case 'invalid_value':
				// @ts-expect-error `valid` is not used currently.
				// eslint-disable-next-line unused-imports/no-unused-vars
				valid = issue.values;
				break;
			case 'invalid_format':
				type = 'contains';
				break;
			// Add more mappings as necessary
		}

		return {
			code: issue.code,
			collection,
			field,
			type,
			group,
			valid: issue.message,
			invalid: issue.message,
		};
	});
}
