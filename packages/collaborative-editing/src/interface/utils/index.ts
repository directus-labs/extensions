/**
 * Extract collection and field name from the active field name
 * @param activeFieldName - The field name in format "collection:fieldName"
 */
export function getDataFromActiveFieldName(
	activeFieldName: string | null,
): { collection: string; field: string; id: string } | null {
	if (!activeFieldName || typeof activeFieldName !== 'string') {
		return null;
	}

	const parts = activeFieldName.split(':');

	if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
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
export function findBorderElement(collection: string, field: string, primaryKey: string): HTMLElement | null {
	// First try to find the direct field element
	const fieldEl = document.querySelector(
		`[data-collection="${collection}"][data-field="${field}"][data-primary-key="${primaryKey}"]`,
	);

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
export function getFieldFromDOM(collection: string, field: string, primaryKey: string): HTMLElement | null {
	const fieldEl = document.querySelector(
		`[data-field="${field}"][data-collection="${collection}"][data-primary-key="${primaryKey}"]`,
	);

	if (!fieldEl) return null;

	return fieldEl as HTMLElement;
}

/**
 * Get all fields from DOM
 */
export function getAllFieldsFromDOM() {
	const renderedFields = document.querySelectorAll('[data-field][data-collection][data-primary-key]');

	if (!renderedFields) return [];

	return renderedFields;
}
/**
 * Get the API root location from the current window path
 */
export function getRootPath(): string {
	return extract(window.location.pathname);
}

/**
 * Get the full API root URL from the current page href
 */
export function getPublicURL(): string {
	return extract(window.location.href);
}

/**
 * Extract the root path of the admin app from a given input path/url
 *
 * @param path - Path or URL string of the current page
 * @returns - Root URL of the Directus instance
 */
export function extract(path: string) {
	const parts = path.split('/');
	const adminIndex = parts.indexOf('admin');
	const rootPath = `${parts.slice(0, adminIndex).join('/')}/`;
	return rootPath;
}

export function getAssetUrl(filename: string, isDownload?: boolean): string {
	const assetUrl = new URL(`assets/${filename}`, getPublicURL());

	if (isDownload) {
		assetUrl.searchParams.set('download', '');
	}

	return assetUrl.href;
}
