/**
 * Parse a Yjs field name into a collection and field
 * @param fieldName - The field name to parse
 * @returns The collection and field
 * @example
 * getDataFromActiveFieldName('users:name') // { collection: 'users', field: 'name' }
 */
export function getDataFromActiveFieldName(fieldName: string) {
	const [collection, field] = fieldName.split(':');

	if (!collection || !field) {
		throw new Error(`Invalid field name, expected format: collection:field, got: ${fieldName}`);
	}

	return { collection, field };
}

/**
 * Get the field name used for Yjs field sync
 * @param el - The element to get the field name from
 * @returns The field name
 * @example
 * <div data-field="name" data-collection="users">
 *   <input type="text" />
 * </div>
 * getActiveFieldNameFromElement(el) // "users:name"
 */
export function getActiveFieldNameFromElement(el: HTMLElement) {
	const fieldName = el.dataset.field;
	const collectionName = el.dataset.collection;

	return fieldName && collectionName ? `${collectionName}:${fieldName}` : null;
}


export function getRenderedFieldElements() {
	const renderedFields = document.querySelectorAll('[data-field], [data-collection]');
	if (!renderedFields) return [];
	return renderedFields;
}
