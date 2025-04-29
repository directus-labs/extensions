/**
 * Extract collection and field name from the active field name
 * @param activeFieldName - The field name in format "collection:fieldName"
 */
export function getDataFromActiveFieldName(activeFieldName: string | null): { collection: string; field: string, id: string } | null {
	if (!activeFieldName || typeof activeFieldName !== 'string') {
		return null;
	}

	const parts = activeFieldName.split(':');

	if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
		console.warn(`Invalid active field name: ${activeFieldName}`);
		return null;
	}

	return {
		collection: parts[0],
		field: parts[1],
		id: parts[2],
	};
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
	const collectionName = el.dataset.collection;
	const fieldName = el.dataset.field;
	const id = el.dataset.id;

	return fieldName && collectionName ? `${collectionName}:${fieldName}:${id}` : null;
}

/**
 * Find the element to add a border to
 */
export function findBorderElement(collectionName: string, fieldName: string, id: string): HTMLElement | null {
	// First try to find the direct field element
	const fieldEl = document.querySelector(`[data-collection="${collectionName}"][data-field="${fieldName}"][data-id="${id}"]`);

	if (!fieldEl) return null;

	// Find the parent field container which has better visual formatting for borders
	const fieldContainer = fieldEl.closest('.field');

	if (fieldContainer) {
		// For most field types, we want to highlight the interface container
		const interfaceEl = fieldContainer.querySelector('.interface');

		if (interfaceEl) {
			// For specific field types, we might want to highlight specific child elements
			const inputEl = interfaceEl.querySelector('.v-input, .v-textarea, .many-to-one, .one-to-many, .many-to-many');

			if (inputEl) {
				return inputEl as HTMLElement;
			}

			return interfaceEl as HTMLElement;
		}

		return fieldContainer as HTMLElement;
	}

	return fieldEl as HTMLElement;
}

/**
 * Get field from DOM
 */
export function getFieldFromDOM(collectionName: string, fieldName: string, id: string): HTMLElement | null {
	const fieldEl = document.querySelector(`[data-field="${fieldName}"][data-collection="${collectionName}"][data-id="${id}"]`);

	if (!fieldEl) return null;

	return fieldEl as HTMLElement;
}

/**
 * Get all fields from DOM
 */
export function getAllFieldsFromDOM() {
	const renderedFields = document.querySelectorAll('[data-field], [data-collection], [data-id]');

	if (!renderedFields) return [];

	return renderedFields;
}
