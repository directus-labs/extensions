import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { onMounted, watch } from 'vue';

export function useFieldLocking(provider: ReturnType<typeof useHocuspocusProvider>) {
	const lockedFields = new Set<string>();

	// Watch for changes in awareness states
	watch(() => provider.awareness.all.value, updateFieldLocking, { deep: true });

	// Initialize on mount
	onMounted(updateFieldLocking);

	function updateFieldLocking() {
		const states = provider.awareness.all.value;
		const self = provider.awareness.local.value;
		const currentUserId = self?.user?.id;

		// First determine which fields should be locked
		const fieldsToLock = new Set<string>();

		for (const state of states) {
			// Skip if this is the current user
			if (state.user?.id === currentUserId) continue;

			// Skip if no active field
			if (!state.activeField?.field) continue;

			// Add to fields that should be locked
			fieldsToLock.add(state.activeField.field);
		}

		// Unlock fields no longer being edited by others
		for (const field of lockedFields) {
			if (!fieldsToLock.has(field)) {
				unlockField(field);
				lockedFields.delete(field);
			}
		}

		// Lock newly locked fields
		for (const field of fieldsToLock) {
			if (!lockedFields.has(field)) {
				lockField(field);
				lockedFields.add(field);
			}
		}
	}

	function findFieldElements(fieldName: string): HTMLElement[] {
		// Find elements by data attribute, name attribute, etc.
		const selectors = [
			`[field="${fieldName}"]`,
		].filter(Boolean);

		const elements: HTMLElement[] = [];

		for (const selector of selectors) {
			const nodeList = document.querySelectorAll(selector);

			for (const el of Array.from(nodeList)) {
				elements.push(el as HTMLElement);
			}
		}

		return elements;
	}

	function lockField(fieldName: string) {
		const elements = findFieldElements(fieldName);

		for (const el of elements) {
			// Find the actual input elements inside the container
			const inputs = el.querySelectorAll('input, textarea, select, [contenteditable="true"]');
			const inputsArray = Array.from(inputs);

			if (inputsArray.length > 0) {
				// If inputs found, disable them
				for (const input of inputsArray) {
					// Save original state in a data attribute
					if (!(input as HTMLElement).dataset.originalDisabled) {
						(input as HTMLElement).dataset.originalDisabled = (input as HTMLInputElement).disabled.toString();
					}

					(input as HTMLInputElement).disabled = true;
				}
			}
			else {
				// If no inputs found, add a pointer-events: none style
				el.dataset.originalPointerEvents = el.style.pointerEvents;
				el.style.pointerEvents = 'none';
			}

			// Add locked class
			el.classList.add('field-locked-by-others');
			el.style.opacity = '0.7';
			el.style.cursor = 'not-allowed';
		}
	}

	function unlockField(fieldName: string) {
		const elements = findFieldElements(fieldName);

		for (const el of elements) {
			// Restore inputs
			const inputs = el.querySelectorAll('input, textarea, select, [contenteditable="true"]');
			const inputsArray = Array.from(inputs);

			if (inputsArray.length > 0) {
				for (const input of inputsArray) {
					// Restore original state
					const originalDisabled = (input as HTMLElement).dataset.originalDisabled;

					if (originalDisabled !== undefined) {
						(input as HTMLInputElement).disabled = originalDisabled === 'true';

						delete (input as HTMLElement).dataset.originalDisabled;
					}
				}
			}
			else {
				// Restore pointer events
				if (el.dataset.originalPointerEvents !== undefined) {
					el.style.pointerEvents = el.dataset.originalPointerEvents;
					delete el.dataset.originalPointerEvents;
				}
			}

			// Remove locked class
			el.classList.remove('field-locked-by-others');
			el.style.opacity = '1';
			el.style.cursor = 'auto';
		}
	}

	return {
		updateFieldLocking,
		isFieldLocked: (fieldName: string) => lockedFields.has(fieldName),
	};
}
