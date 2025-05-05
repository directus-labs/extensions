import type { FilterOperator, ValidationError } from '@directus/types';
import type { ZodError, ZodIssue } from 'zod';

export function zodErrorToValidationErrors(
  error: ZodError,
  collection: string,
  group: string | null = null,
): ValidationError[] {
  return error.issues.map((issue: ZodIssue): ValidationError => {
    const field = issue.path.join('.');
    let type: FilterOperator = 'eq'; // Default
    let valid: ValidationError['valid'];

    switch (issue.code) {
      case 'invalid_enum_value':
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        valid = issue.options;
        break;
      case 'invalid_string':
        type = 'contains';
        break;
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
