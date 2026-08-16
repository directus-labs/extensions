import type { ValidationError } from '@directus/types';
import type { core, ZodError } from 'zod';

export function zodErrorToValidationErrors(
	error: ZodError,
	collection: string,
	group: string | null | undefined = null,
): ValidationError[] {
	return error.issues.map((issue: core.$ZodIssue): ValidationError => ({
		code: issue.code,
		collection,
		field: issue.path.join('.'),
		type: issue.code === 'invalid_format' ? 'contains' : 'eq',
		group: group ?? null,
		valid: issue.message,
		invalid: issue.message,
	}));
}
