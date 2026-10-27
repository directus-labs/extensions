import { getFieldsFromTemplate } from './get-fields-from-template';

interface FieldsStore {
	getField: (collection: string, field: string) => unknown;
}

/**
 * Requesting or filtering on a field the user can't read fails the whole request. The fields store
 * only holds readable fields, so use it to drop the rest.
 */
export function getReadableFields(fieldsStore: FieldsStore, collection: string, fields: string[]) {
	return fields.filter((field) => fieldsStore.getField(collection, field));
}

/** Keeps the readable template fields, falling back to the primary key when none are left. */
export function getReadableDisplayTemplate(
	fieldsStore: FieldsStore,
	collection: string,
	template: string | null | undefined,
	primaryKeyField: string,
) {
	const fields = getReadableFields(fieldsStore, collection, getFieldsFromTemplate(template ?? '') ?? []);
	if (!template || fields.length === 0) return { template: `{{${primaryKeyField}}}`, fields: [primaryKeyField] };
	return { template, fields };
}
