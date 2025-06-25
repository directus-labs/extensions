import { WYSIWYG_EDITOR_SELECTOR } from '../constants';

export function findBorderElement(collection: string, field: string, primaryKey: string): HTMLElement | null {
	const selector = `[data-collection="${collection}"][data-field="${field}"][data-primary-key="${primaryKey}"]`;
	const fieldElement = document.querySelector(selector) as HTMLElement | null;

	if (!fieldElement) return null;

	// Special handling for TinyMCE
	const tinyMCEEditor = fieldElement.querySelector(WYSIWYG_EDITOR_SELECTOR) as HTMLElement | null;
	if (tinyMCEEditor) {
		// For TinyMCE, we want to apply the border to the entire editor container
		const editorContainer = tinyMCEEditor.closest('.interface') || tinyMCEEditor;
		return editorContainer as HTMLElement;
	}

	// For regular inputs, find the most appropriate element
	const input = fieldElement.querySelector('input, textarea, select, [contenteditable="true"]') as HTMLElement | null;
	if (input) {
		// For inputs, find their wrapping container
		const inputContainer = input.closest('.input, .v-input') || input.parentElement;
		return (inputContainer as HTMLElement) || input;
	}

	// Default fallback
	return fieldElement;
}

export function getFieldFromDOM(collection: string, field: string, primaryKey: string): HTMLElement | null {
	const selector = `[data-collection="${collection}"][data-field="${field}"][data-primary-key="${primaryKey}"]`;
	return document.querySelector(selector) as HTMLElement | null;
}
