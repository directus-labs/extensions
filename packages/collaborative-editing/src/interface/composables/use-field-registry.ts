import { ref, watch, onMounted, onUnmounted, readonly } from 'vue';
import { useActiveElement } from '@vueuse/core';
import { debounce, DebouncedFunc } from 'lodash-es';
import { useFieldMeta } from './use-field-meta';
import { DirectusProvider } from './use-doc';
import { ACTIVE_FIELD_SELECTOR } from '../constants';
import { useAwarenessStore } from '../stores/awarenessStore';
import type { FieldMeta } from './use-field-meta';

export interface FieldHandler {
	name: string;
	// Element detection
	selector: string;
	detect: (el: HTMLElement) => boolean;

	// Activation detection
	activation: {
		type: 'focus' | 'class' | 'custom';
		className?: string;
		customCheck?: (el: HTMLElement) => boolean;
	};

	// Hooks
	onBeforeActivate?: (el: HTMLElement, fieldMeta: FieldMeta) => boolean; // return false to prevent
	onAfterActivate?: (el: HTMLElement, fieldMeta: FieldMeta) => void;
	onBeforeDeactivate?: (el: HTMLElement, fieldMeta: FieldMeta) => boolean; // return false to prevent
	onAfterDeactivate?: (el: HTMLElement, fieldMeta: FieldMeta) => void;

	// Deactivation settings
	deactivation: {
		debounceMs?: number;
		checkOnDocumentClick?: boolean;
		// Selectors to ignore when checking document clicks
		// One example is the TinyMCE toolbar, which should not be considered a deactivation trigger
		ignoreClickSelectors?: string[];
	};
}

interface ActiveField {
	element: HTMLElement;
	fieldMeta: FieldMeta;
	handler: FieldHandler;
}

export function useFieldRegistry(provider: DirectusProvider) {
	const { getFieldMetaFromPayload } = useFieldMeta();
	const activeElement = useActiveElement();
	const awarenessStore = useAwarenessStore();

	// Helper function to get field meta from element
	function getFieldMetaFromElement(el: HTMLElement): FieldMeta | null {
		const fieldContainer = el.closest(ACTIVE_FIELD_SELECTOR) as HTMLElement | null;

		if (!fieldContainer) return null;

		const collection = fieldContainer.dataset.collection;
		const field = fieldContainer.dataset.field;
		const primaryKey = fieldContainer.dataset.primaryKey;

		if (!collection || !field || !primaryKey) return null;

		return getFieldMetaFromPayload({ collection, field, primaryKey });
	}

	const handlers = new Map<string, FieldHandler>();
	const activeField = ref<ActiveField | null>(null);
	const observers = new Set<MutationObserver>();
	let isWindowFocused = true;

	// Create debounced deactivation functions for each handler
	const debouncedDeactivations = new Map<string, DebouncedFunc<() => void>>();

	// Helper functions for field locking
	function findFieldInputElement(el: HTMLElement): HTMLElement[] {
		const inputs = el.querySelectorAll(
			'.interface > *:first-child,.interface input,.interface .input,.interface textarea,.interface select,.interface [contenteditable="true"]',
		);
		return Array.from(inputs).filter((i) => i instanceof HTMLElement);
	}

	function lockFieldElement(el: HTMLElement) {
		// Find the actual input elements inside the container
		const inputsArray = findFieldInputElement(el);

		if (inputsArray.length > 0) {
			// If inputs found, disable them
			for (const input of inputsArray) {
				const disabled = input.classList.contains('disabled');

				// Save original state in a data attribute
				if (!input.dataset.originalDisabled) {
					input.dataset.originalDisabled = disabled + '';
				}

				if (
					input instanceof HTMLInputElement ||
					input instanceof HTMLTextAreaElement ||
					input instanceof HTMLSelectElement
				) {
					input.disabled = true;
				}

				input.classList.add('disabled');
			}
		}

		// Add locked class
		el.classList.add('collab-field-locked');
	}

	function unlockFieldElement(el: HTMLElement) {
		// Restore inputs
		const inputsArray = findFieldInputElement(el);

		if (inputsArray.length > 0) {
			for (const input of inputsArray) {
				// Restore original state
				const originalDisabled = input.dataset.originalDisabled;

				if (originalDisabled === 'false') {
					input.classList.remove('disabled');

					if (
						input instanceof HTMLInputElement ||
						input instanceof HTMLTextAreaElement ||
						input instanceof HTMLSelectElement
					) {
						input.disabled = false;
					}
				}

				if (input.dataset.originalDisabled !== undefined) {
					delete input.dataset.originalDisabled;
				}
			}
		}

		// Remove locked class
		el.classList.remove('collab-field-locked');
	}

	function updateFieldLocking() {
		const states = Object.values(awarenessStore.byUid);

		// Determine which fields should be locked
		const fieldsToLock = new Set<string>();

		for (const state of states) {
			// Skip if this is the current user
			if (state.user?.isCurrentUser) continue;

			// Skip if no active field
			if (!state.activeField) continue;

			// Add to fields that should be locked
			const fieldKey = `${state.activeField.collection}:${state.activeField.field}:${state.activeField.primaryKey}`;
			fieldsToLock.add(fieldKey);
		}

		// Get all field elements currently in the DOM
		const allFieldElements = document.querySelectorAll(ACTIVE_FIELD_SELECTOR);

		for (const fieldElement of allFieldElements) {
			const el = fieldElement as HTMLElement;
			const collection = el.dataset.collection;
			const field = el.dataset.field;
			const primaryKey = el.dataset.primaryKey;

			if (!collection || !field || !primaryKey) continue;

			const fieldKey = `${collection}:${field}:${primaryKey}`;
			const isCurrentlyLocked = el.classList.contains('collab-field-locked');
			const shouldBeLocked = fieldsToLock.has(fieldKey);

			if (shouldBeLocked && !isCurrentlyLocked) {
				lockFieldElement(el);
			} else if (!shouldBeLocked && isCurrentlyLocked) {
				unlockFieldElement(el);
			}
		}
	}

	// Registry methods
	function registerHandler(handler: FieldHandler) {
		handlers.set(handler.name, handler);

		// Create debounced deactivation
		debouncedDeactivations.set(handler.name, createDebouncedDeactivation(handler));

		// Return cleanup function
		return () => unregisterHandler(handler.name);
	}

	function unregisterHandler(name: string) {
		handlers.delete(name);
	}

	// Core activation/deactivation logic
	function activateField(element: HTMLElement, fieldMeta: FieldMeta, handler: FieldHandler) {
		// Prevent activation if already active with same field
		if (
			activeField.value &&
			activeField.value.fieldMeta.field === fieldMeta.field &&
			activeField.value.fieldMeta.collection === fieldMeta.collection &&
			activeField.value.fieldMeta.primaryKey === fieldMeta.primaryKey
		) {
			return;
		}

		// Check pre-activation hook
		if (handler.onBeforeActivate && !handler.onBeforeActivate(element, fieldMeta)) {
			return;
		}

		// Deactivate current field if different
		if (activeField.value) {
			deactivateField();
		}

		activeField.value = { element, fieldMeta, handler };
		provider.activateField(fieldMeta);

		// Post-activation hook
		handler.onAfterActivate?.(element, fieldMeta);
	}

	function deactivateField() {
		if (!activeField.value) return;

		const { element, fieldMeta, handler } = activeField.value;

		// Check pre-deactivation hook
		if (handler.onBeforeDeactivate && !handler.onBeforeDeactivate(element, fieldMeta)) {
			return;
		}

		provider.deactivateField();

		// Post-deactivation hook
		handler.onAfterDeactivate?.(element, fieldMeta);

		activeField.value = null;
	}

	function createDebouncedDeactivation(handler: FieldHandler) {
		const debounceMs = handler.deactivation.debounceMs ?? 100;
		return debounce(() => {
			// Double-check the field is still inactive
			if (activeField.value && activeField.value.handler.name === handler.name) {
				const stillActive = checkIfStillActive(activeField.value);
				if (!stillActive) {
					deactivateField();
				}
			}
		}, debounceMs);
	}

	function checkIfStillActive(active: ActiveField): boolean {
		const { element, handler } = active;

		switch (handler.activation.type) {
			case 'focus':
				return element === document.activeElement || element.contains(document.activeElement);

			case 'class':
				if (!handler.activation.className) return false;
				return element.classList.contains(handler.activation.className);

			case 'custom':
				return handler.activation.customCheck?.(element) ?? false;

			default:
				return false;
		}
	}

	// Handle focus-based activations
	// Used for basic input fields
	watch(activeElement, (el) => {
		if (!el) {
			// Lost focus entirely
			if (activeField.value && activeField.value.handler.activation.type === 'focus') {
				const debouncedDeactivate = debouncedDeactivations.get(activeField.value.handler.name);
				debouncedDeactivate?.();
			}
			return;
		}

		// Find handler for this element
		for (const handler of handlers.values()) {
			if (handler.activation.type === 'focus' && handler.detect(el as HTMLElement)) {
				const fieldMeta = getFieldMetaFromElement(el as HTMLElement);
				if (fieldMeta) {
					activateField(el as HTMLElement, fieldMeta, handler);
					break;
				}
			}
		}
	});

	// Handle class-based and custom activations with mutation observer
	// Used for more complex fields like TinyMCE, which exists in an iframe
	// so focus detection doesn't work
	function setupMutationObserver() {
		const observer = new MutationObserver((mutations) => {
			let shouldApplyLocking = false;

			for (const mutation of mutations) {
				// Handle attribute changes (for class-based activation)
				if (mutation.type === 'attributes') {
					const target = mutation.target as HTMLElement;

					// Check each handler
					for (const handler of handlers.values()) {
						if (handler.activation.type === 'class' && mutation.attributeName === 'class' && handler.detect(target)) {
							const hasClass = handler.activation.className && target.classList.contains(handler.activation.className);
							const fieldMeta = getFieldMetaFromElement(target);

							if (hasClass && fieldMeta) {
								activateField(target, fieldMeta, handler);
							} else if (
								!hasClass &&
								activeField.value &&
								activeField.value.handler.name === handler.name &&
								activeField.value.element === target
							) {
								const debouncedDeactivate = debouncedDeactivations.get(handler.name);
								debouncedDeactivate?.();
							}
						}
					}
				}

				// Handle DOM changes (for accordion expansion/collapse)
				if (mutation.type === 'childList') {
					const addedNodes = Array.from(mutation.addedNodes);

					// Check if any field elements were added
					for (const node of addedNodes) {
						if (node instanceof HTMLElement) {
							// Check if this node or its children contain field elements
							const hasFieldElements =
								node.matches?.(ACTIVE_FIELD_SELECTOR) || node.querySelector?.(ACTIVE_FIELD_SELECTOR);

							if (hasFieldElements) {
								shouldApplyLocking = true;
								break;
							}
						}
					}
				}
			}

			// Apply field locking to newly visible elements if needed
			if (shouldApplyLocking) {
				// Use a small delay to ensure DOM is fully rendered
				setTimeout(() => {
					updateFieldLocking();
				}, 10);
			}
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
			childList: true,
			subtree: true,
		});

		observers.add(observer);
		return observer;
	}

	// Handle document clicks for deactivation
	function handleDocumentClick(event: Event) {
		if (!activeField.value || !isWindowFocused) return;

		// Check if the click event target is null or not an element within the document
		// This can happen if the click occurred outside the browser window
		if (!event.target || !(event.target instanceof Node) || !document.contains(event.target as Node)) {
			return; // Ignore clicks outside the document/window
		}

		const target = event.target as HTMLElement;

		// Global deactivation logic - always check if click is outside any field
		const clickedWithinAnyField = target.closest(ACTIVE_FIELD_SELECTOR);

		if (!clickedWithinAnyField) {
			// Check global ignore selectors that should never trigger deactivation
			const globalIgnoreSelectors = [
				'.v-menu',
				'.v-dialog',
				'.v-overlay',
				'.tox-toolbar',
				'.tox-menubar',
				'.tox-sidebar',
				'.tox-dialog',
			];

			const shouldIgnoreGlobally = globalIgnoreSelectors.some((selector) => target.closest(selector) !== null);

			if (!shouldIgnoreGlobally) {
				deactivateField();
				return; // Exit early since we've already deactivated
			}
		}

		// Continue with existing handler-specific logic if we didn't deactivate globally
		const { handler } = activeField.value;

		if (!handler.deactivation.checkOnDocumentClick) return;

		// Check handler-specific ignore selectors
		const ignoreSelectors = handler.deactivation.ignoreClickSelectors ?? [];
		for (const selector of ignoreSelectors) {
			if (target.closest(selector)) {
				return;
			}
		}

		// Check if field is still active according to its specific activation type
		const stillActive = checkIfStillActive(activeField.value);
		if (!stillActive) {
			deactivateField();
		}
	}

	// Window focus tracking
	function handleWindowFocus() {
		isWindowFocused = true;
	}

	function handleWindowBlur() {
		isWindowFocused = false;
	}

	// Watch for awareness store changes to update field locking
	watch(
		() => awarenessStore.byUid,
		() => {
			updateFieldLocking();
		},
		{ deep: true },
	);

	// Setup and teardown
	onMounted(() => {
		// Setup event listeners
		window.addEventListener('focus', handleWindowFocus);
		window.addEventListener('blur', handleWindowBlur);
		document.addEventListener('click', handleDocumentClick);

		// Setup mutation observer
		setupMutationObserver();

		// Initial application of field locking
		updateFieldLocking();
	});

	onUnmounted(() => {
		cleanup();
	});

	function cleanup() {
		// Remove event listeners
		window.removeEventListener('focus', handleWindowFocus);
		window.removeEventListener('blur', handleWindowBlur);
		document.removeEventListener('click', handleDocumentClick);

		// Disconnect observers
		for (const observer of observers) {
			observer.disconnect();
		}
		observers.clear();

		// Cancel debounced functions
		for (const debouncedFn of debouncedDeactivations.values()) {
			if (typeof debouncedFn.cancel === 'function') {
				debouncedFn.cancel();
			}
		}
		debouncedDeactivations.clear();

		// Clear active field
		activeField.value = null;
	}

	return {
		registerHandler,
		unregisterHandler,
		activeField: readonly(activeField),
		cleanup,
		// Utility methods
		isFieldActive: (fieldMeta: FieldMeta) => {
			return (
				activeField.value?.fieldMeta.field === fieldMeta.field &&
				activeField.value?.fieldMeta.collection === fieldMeta.collection &&
				activeField.value?.fieldMeta.primaryKey === fieldMeta.primaryKey
			);
		},
		getActiveHandler: () => activeField.value?.handler.name,
		// Field locking methods
		updateFieldLocking,
		isFieldLocked: (fieldMeta: FieldMeta) => {
			const fieldElement = document.querySelector(
				`[data-collection="${fieldMeta.collection}"][data-field="${fieldMeta.field}"][data-primary-key="${fieldMeta.primaryKey}"]`,
			);
			return fieldElement?.classList.contains('collab-field-locked') ?? false;
		},
	};
}

// Handler for simple input fields that can be focused
export const standardFieldHandler: FieldHandler = {
	name: 'standard',
	selector: 'input, textarea, select, [contenteditable]',
	detect: (el) => el.matches('input, textarea, select, [contenteditable]'),
	activation: {
		type: 'focus',
	},
	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: false, // No need for this. Focus handles this automatically
	},
};

export const selectFieldHandler: FieldHandler = {
	name: 'select',
	selector: '.v-select .input',
	detect: (el) => el.matches('.v-select .input'),
	activation: {
		type: 'class',
		className: 'active',
	},
	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: true,
		ignoreClickSelectors: ['.v-select', '.v-menu', '.v-overlay'],
	},
};

export const wysiwygFieldHandler: FieldHandler = {
	name: 'wysiwyg',
	selector: '.tox-tinymce',
	detect: (el) => el.matches('.tox-tinymce'),
	activation: {
		type: 'class',
		className: 'focus',
	},
	deactivation: {
		debounceMs: 100,
		checkOnDocumentClick: true,
		ignoreClickSelectors: ['.tox-toolbar', '.tox-menubar', '.tox-sidebar', '.tox-dialog', '.tox-tinymce'],
	},
	onBeforeDeactivate: () => {
		// If window doesn't have focus, prevent deactivation
		if (!document.hasFocus()) {
			return false; // Prevent deactivation
		}
		return true; // Allow normal deactivation logic
	},
};
