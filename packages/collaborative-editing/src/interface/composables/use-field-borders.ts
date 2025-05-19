import Color from 'colorjs.io';
import { watch } from 'vue';
import { useAwarenessStore } from '../stores/awarenessStore';
import { findBorderElement } from '../utils';
import { WYSIWYG_EDITOR_SELECTOR } from '../constants';

export function useFieldBorders() {
	const allFields = new Set<string>();
	const elementsWithBorders = new Set<HTMLElement>();
	const awarenessStore = useAwarenessStore();

	// Function to update field borders with a given alpha value
	function updateBorders() {
		console.log('updateBorders');
		const states = awarenessStore.list;

		// Get current user and active field
		const self = awarenessStore.getCurrentUser();
		const localField = self?.activeField;

		// Track all fields
		for (const state of states) {
			if (state.activeField?.field) {
				allFields.add(state.activeField.field);
			}
		}

		// Clear all field borders first
		for (const element of elementsWithBorders) {
			if (element?.style) {
				element.style.removeProperty('box-shadow');
			}
		}

		elementsWithBorders.clear();

		// Set box-shadow rings for active fields
		for (const state of states) {
			if (
				!state.activeField?.field ||
				(state.activeField.field === localField?.field &&
					state.activeField.collection === localField?.collection &&
					state.activeField.primaryKey === localField?.primaryKey)
			) {
				continue;
			}

			const { collection, field, primaryKey } = state.activeField;

			// Find the actual field element
			const selector = `[data-field="${field}"][data-collection="${collection}"][data-primary-key="${primaryKey}"]`;
			const fieldElement = document.querySelector(selector) as HTMLElement | null;

			if (!fieldElement) continue;

			// Find the proper element to add the border to
			const el = findBorderElement(collection, field, primaryKey) as HTMLElement | null;

			if (!el?.style || !self) continue;

			const primaryColor = getComputedStyle(document.body).getPropertyValue('--theme--primary');
			const color = new Color(state.user.id === self.user.id ? primaryColor : state.user.color);
			color.alpha = 0.8;

			el.style.boxShadow = `0 0 0 2px ${color.toString()}`;
			elementsWithBorders.add(el);
		}
	}

	watch(
		() => awarenessStore.list,
		() => {
			updateBorders();
		},
		{ deep: true, immediate: true },
	);

	// Observe for TinyMCE editors being created and initialized
	function observeTinyMCECreation() {
		const observer = new MutationObserver((mutations) => {
			let needsUpdate = false;

			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					const addedNodes = Array.from(mutation.addedNodes);

					// Check if any TinyMCE editors were added
					for (const node of addedNodes) {
						if (node instanceof HTMLElement) {
							if (node.classList?.contains(WYSIWYG_EDITOR_SELECTOR) || node.querySelector(WYSIWYG_EDITOR_SELECTOR)) {
								needsUpdate = true;
								break;
							}
						}
					}
				}
			}

			if (needsUpdate) {
				// Wait a moment for the editors to finish initializing
				setTimeout(() => {
					updateBorders();
				}, 200);
			}
		});

		// Observe the entire document for TinyMCE editors being added
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		return observer;
	}

	// Start observing for TinyMCE editor creation
	const editorObserver = observeTinyMCECreation();

	return {
		updateFieldBorders: () => updateBorders(),
		cleanup: () => {
			editorObserver.disconnect();

			// Clean up borders on unmount
			for (const element of elementsWithBorders) {
				if (element?.style) {
					element.style.removeProperty('box-shadow');
				}
			}
		},
	};
}
