import { ref, watch, onMounted, onUnmounted, readonly } from 'vue';
import { useActiveElement } from '@vueuse/core';
import { debounce, DebouncedFunc } from 'lodash-es';
import { useFieldMeta } from './use-field-meta';
import { DirectusProvider } from './use-doc';
import { ACTIVE_FIELD_SELECTOR } from '../constants';
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

	// Registry methods
	function registerHandler(handler: FieldHandler) {
		handlers.set(handler.name, handler);
		console.log(`Registered field handler: ${handler.name}`);

		// Create debounced deactivation
		debouncedDeactivations.set(handler.name, createDebouncedDeactivation(handler));

		// Return cleanup function
		return () => unregisterHandler(handler.name);
	}

	function unregisterHandler(name: string) {
		handlers.delete(name);
		console.log(`Unregistered field handler: ${name}`);
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

		console.log(`Activating field: ${fieldMeta.field} via ${handler.name}`);
		activeField.value = { element, fieldMeta, handler };
		provider.activateField(fieldMeta);

		// Post-activation hook
		handler.onAfterActivate?.(element, fieldMeta);
	}

	function deactivateField() {
		console.log('deactivateField 1 - activeField.value', activeField.value);
		if (!activeField.value) return;

		const { element, fieldMeta, handler } = activeField.value;

		console.log('deactivateField 2 - element, fieldMeta, handler', { element, fieldMeta, handler });

		// Check pre-deactivation hook
		if (handler.onBeforeDeactivate && !handler.onBeforeDeactivate(element, fieldMeta)) {
			return;
		}

		console.log(`deactivateField 3 - Deactivating field: ${fieldMeta.field} via ${handler.name}`);
		provider.deactivateField();

		// Post-deactivation hook
		handler.onAfterDeactivate?.(element, fieldMeta);

		activeField.value = null;
	}

	// Create debounced deactivation functions for each handler
	const debouncedDeactivations = new Map<string, DebouncedFunc<() => void>>();

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
			for (const mutation of mutations) {
				if (mutation.type !== 'attributes') continue;

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
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
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

	// Setup and teardown
	onMounted(() => {
		// Setup event listeners
		window.addEventListener('focus', handleWindowFocus);
		window.addEventListener('blur', handleWindowBlur);
		document.addEventListener('click', handleDocumentClick);

		// Setup mutation observer
		setupMutationObserver();
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
	onAfterActivate: (el, fieldMeta) => {
		console.log(`Select field ${fieldMeta.field} activated, el: ${el}`);
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
	onAfterActivate: (el, fieldMeta) => {
		console.log(`WYSIWYG field ${fieldMeta.field} activated, el: ${el}`);
	},
	onBeforeDeactivate: () => {
		// If window doesn't have focus, prevent deactivation
		if (!document.hasFocus()) {
			return false; // Prevent deactivation
		}
		return true; // Allow normal deactivation logic
	},
};
