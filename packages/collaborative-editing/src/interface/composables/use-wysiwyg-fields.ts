import { onMounted, onUnmounted } from 'vue';
import { ACTIVE_FIELD_SELECTOR, WYSIWYG_FOCUS_SELECTOR, WYSIWYG_SELECTOR } from '../constants';
import { DirectusProvider } from './use-doc';
import { debounce } from 'lodash-es';

export function useWysiwygFields(provider: DirectusProvider) {
	// Store the mutation observer
	let observer: MutationObserver | null = null;
	let currentField: { collection: string; field: string; primaryKey: string } | null = null;
	let isWindowFocused = true;

	// Track window focus state
	onMounted(() => {
		window.addEventListener('focus', () => {
			isWindowFocused = true;
		});
		window.addEventListener('blur', () => {
			isWindowFocused = false;
		});
	});

	// Debounced deactivation to prevent rapid toggling
	const debouncedDeactivate = debounce(() => {
		const activeEditors = document.querySelectorAll('.tox-tinymce.focus');
		if (activeEditors.length === 0) {
			provider.deactivateField();
			currentField = null;
		}
	}, 100);

	// Handle clicks outside the WYSIWYG editor
	function handleDocumentClick(event: Event) {
		if (!currentField) return;

		// Check if the click is within the browser window
		// If the click target is the document or window, it means the click was outside the browser
		if (event.target === document || event.target === window) return;

		const target = event.target as HTMLElement;

		// Check if click is within TinyMCE UI elements
		const clickedToolbar = target.closest('.tox-toolbar, .tox-menubar, .tox-sidebar, .tox-dialog');
		if (clickedToolbar) return;

		// Check if click is within any WYSIWYG editor
		const clickedEditor = target.closest(WYSIWYG_SELECTOR);
		if (clickedEditor) return;

		// If we get here, the click was outside any WYSIWYG editor
		// Find the currently active field container
		const activeFieldSelector = `[data-collection="${currentField.collection}"][data-field="${currentField.field}"][data-primary-key="${currentField.primaryKey}"]`;
		const activeFieldContainer = document.querySelector(activeFieldSelector);

		if (!activeFieldContainer) {
			// Field no longer exists, deactivate
			provider.deactivateField();
			currentField = null;
			return;
		}

		// Check if the active TinyMCE still has focus
		const activeTinyMCE = activeFieldContainer.querySelector(WYSIWYG_FOCUS_SELECTOR);
		if (!activeTinyMCE) {
			// TinyMCE lost focus, deactivate
			provider.deactivateField();
			currentField = null;
		}
	}

	onMounted(() => {
		// Add document click listener
		document.addEventListener('click', handleDocumentClick);

		// Set up the mutation observer to watch for the focus class on TinyMCE editors
		observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type !== 'attributes' || mutation.attributeName !== 'class') {
					continue;
				}

				const targetElement = mutation.target as HTMLElement;

				// Check if this is a TinyMCE editor
				if (!targetElement.classList.contains('tox-tinymce')) {
					continue;
				}

				// Check if the editor has been focused or unfocused
				const isFocused = targetElement.classList.contains('focus');

				// Find the closest .wysiwyg container
				const wysiwygContainer = targetElement.closest(WYSIWYG_SELECTOR) as HTMLElement | null;

				if (!wysiwygContainer) {
					continue;
				}

				// Find the field container which has the data attributes we need
				const fieldContainer = wysiwygContainer.closest(ACTIVE_FIELD_SELECTOR) as HTMLElement | null;

				if (!fieldContainer) {
					continue;
				}

				if (isFocused) {
					// Extract field parameters and activate the field
					const fieldParams = getFieldParamsFromElement(fieldContainer);
					if (fieldParams) {
						// Only activate if it's a different field
						if (
							!currentField ||
							currentField.collection !== fieldParams.collection ||
							currentField.field !== fieldParams.field ||
							currentField.primaryKey !== fieldParams.primaryKey
						) {
							currentField = fieldParams;
							provider.activateField(fieldParams);
						}
					}
				} else if (isWindowFocused) {
					debouncedDeactivate();
				}
			}
		});

		// Observe only class changes on TinyMCE editors
		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
			subtree: true,
			childList: false,
			characterData: false,
		});
	});

	onUnmounted(() => {
		if (observer) {
			observer.disconnect();
		}
		document.removeEventListener('click', handleDocumentClick);
		window.removeEventListener('focus', () => {});
		window.removeEventListener('blur', () => {});
		debouncedDeactivate.cancel();
	});
}

function getFieldParamsFromElement(el: HTMLElement) {
	const collection = el.dataset.collection;
	const field = el.dataset.field;
	const primaryKey = el.dataset.primaryKey;

	if (collection && field && primaryKey) {
		return { collection, field, primaryKey };
	}

	return null;
}
