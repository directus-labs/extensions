import { onMounted, onUnmounted } from 'vue';
import { DirectusProvider } from './use-doc';
import { ACTIVE_FIELD_SELECTOR, WYSIWYG_EDITOR_SELECTOR, WYSIWYG_FOCUS_SELECTOR, WYSIWYG_SELECTOR } from '../constants';

export function useWysiwygFocus(provider: DirectusProvider) {
	let currentActiveField: { collection: string; field: string; primaryKey: string } | null = null;

	// Click handler for TinyMCE activation
	function handleTinyMCEClick(event: Event) {
		console.log('handleTinyMCEClick', currentActiveField);
		const target = event.target as HTMLElement;

		// Find the closest TinyMCE editor
		const tinyMCEEditor = target.closest(WYSIWYG_EDITOR_SELECTOR) as HTMLElement;
		if (!tinyMCEEditor) return;

		// Find the field container with data attributes
		const fieldContainer = tinyMCEEditor.closest(ACTIVE_FIELD_SELECTOR) as HTMLElement;
		if (!fieldContainer) return;

		// Extract field parameters
		const collection = fieldContainer.dataset.collection;
		const field = fieldContainer.dataset.field;
		const primaryKey = fieldContainer.dataset.primaryKey;

		if (!collection || !field || !primaryKey) return;

		const checkFocusAndActivate = () => {
			if (tinyMCEEditor.classList.contains('focus')) {
				// Store the currently active field
				currentActiveField = { collection, field, primaryKey };

				// Activate the field using existing provider method
				provider.activateField({ collection, field, primaryKey });
			}
		};

		checkFocusAndActivate();
	}

	// Document click handler for deactivation
	function handleDocumentClick(event: Event) {
		if (!currentActiveField) return;

		const target = event.target as HTMLElement;

		// Check if click is outside TinyMCE editors or within TinyMCE toolbar/menu areas
		const clickedEditor = target.closest(WYSIWYG_SELECTOR);
		const clickedToolbar = target.closest('.tox-toolbar, .tox-menubar, .tox-sidebar, .tox-dialog');

		// Don't deactivate if clicking within TinyMCE UI elements
		if (clickedToolbar) return;

		// If clicked on a different TinyMCE editor, let the click handler deal with it
		if (clickedEditor) return;

		// Find the currently active field container
		const activeFieldSelector = `[data-collection="${currentActiveField.collection}"][data-field="${currentActiveField.field}"][data-primary-key="${currentActiveField.primaryKey}"]`;
		const activeFieldContainer = document.querySelector(activeFieldSelector);

		if (!activeFieldContainer) {
			provider.deactivateField();
			currentActiveField = null;
			return;
		}

		// Check if the active TinyMCE still has focus
		const activeTinyMCE = activeFieldContainer.querySelector(WYSIWYG_FOCUS_SELECTOR);

		if (!activeTinyMCE) {
			// TinyMCE lost focus, deactivate
			provider.deactivateField();
			currentActiveField = null;
		}
	}

	onMounted(() => {
		// Listen for new TinyMCE editors being added to DOM
		const observer = new MutationObserver((mutations) => {
			console.log('MutationObserver triggered', mutations.length);

			mutations.forEach((mutation) => {
				// Only process added nodes
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node instanceof HTMLElement) {
							// Check if the added node is or contains a TinyMCE editor
							const tinyMCEEditors = node.classList?.contains(WYSIWYG_EDITOR_SELECTOR)
								? [node]
								: Array.from(node.querySelectorAll(WYSIWYG_EDITOR_SELECTOR) || []);

							tinyMCEEditors.forEach((editor) => {
								const fieldContainer = editor.closest(ACTIVE_FIELD_SELECTOR);
								if (fieldContainer && !fieldContainer.hasAttribute('data-tinymce-listener')) {
									fieldContainer.addEventListener('click', handleTinyMCEClick);
									fieldContainer.setAttribute('data-tinymce-listener', 'true');
								}
							});
						}
					});
				}
			});
		});

		const mainContainer = document.querySelector(WYSIWYG_SELECTOR) || document.body;

		observer.observe(mainContainer, {
			childList: true,
			subtree: true,
			attributes: false,
			characterData: false,
		});

		onUnmounted(() => {
			observer.disconnect();
			// Clean up listeners
			const fieldContainers = document.querySelectorAll(ACTIVE_FIELD_SELECTOR);
			fieldContainers.forEach((container) => {
				container.removeEventListener('click', handleTinyMCEClick);
				container.removeAttribute('data-tinymce-listener');
			});

			document.removeEventListener('click', handleDocumentClick);
		});
	});
}
