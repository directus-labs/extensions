import { ZodError, ZodIssue } from 'zod';
import { ValidationError, FilterOperator } from '@directus/types';

export function zodErrorToValidationErrors(error: ZodError, collection: string, group: string | null = null): ValidationError[] {
    console.log(error.issues)
    return error.issues.map((issue: ZodIssue): ValidationError => {
        let field = issue.path.join('.');
        let type: FilterOperator = 'eq'; // Default value, modify as necessary
        let valid: ValidationError['valid'];

        switch (issue.code) {
            case 'invalid_enum_value':
                valid = issue.options
                break;
            case 'invalid_string':
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
