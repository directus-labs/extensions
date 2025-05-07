import { onMounted, watch } from 'vue';
import { useAwarenessStore } from '../stores/awarenessStore';
import type { ActiveField } from '../types';

export function useFieldLocking() {
	const awarenessStore = useAwarenessStore();
	const lockedFields = new Set<Omit<ActiveField, 'uid'>>();

	// Watch for changes in awareness states
	watch(() => awarenessStore.byUid, updateFieldLocking, { deep: true });

	// Initialize on mount
	onMounted(updateFieldLocking);

	function updateFieldLocking() {
		const states = Object.values(awarenessStore.byUid);

		// First determine which fields should be locked
		const fieldsToLock = new Set<Omit<ActiveField, 'uid'>>();

		for (const state of states) {
			// Skip if this is the current user
			if (state.user?.isCurrentUser) continue;

			// Skip if no active field
			if (!state.activeField) continue;

			// Add to fields that should be locked
			fieldsToLock.add({
				collection: state.activeField.collection,
				field: state.activeField.field,
				primaryKey: state.activeField.primaryKey,
			});
		}

		// Unlock fields no longer being edited by others
		for (const field of lockedFields) {
			if (
				!Array.from(fieldsToLock).some(
					(f) => f.field === field.field && f.collection === field.collection && f.primaryKey === field.primaryKey,
				)
			) {
				unlockField(field);
				lockedFields.delete(field);
			}
		}

		// Lock newly locked fields
		for (const field of fieldsToLock) {
			if (
				!Array.from(lockedFields).some(
					(f) => f.field === field.field && f.collection === field.collection && f.primaryKey === field.primaryKey,
				)
			) {
				lockField(field);
				lockedFields.add(field);
			}
		}
	}

	function findFieldElements(field: Omit<ActiveField, 'uid'>): HTMLElement[] {
		// Find elements by data attribute, name attribute, etc.
		const selector = `[data-collection="${field.collection}"][data-field="${field.field}"][data-primary-key="${field.primaryKey}"]`;

		const elements = document.querySelectorAll(selector);

		return Array.from(elements) as HTMLElement[];
	}

	function lockField(field: Omit<ActiveField, 'uid'>) {
		const elements = findFieldElements(field);
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
			} else {
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

	function unlockField(field: Omit<ActiveField, 'uid'>) {
		const elements = findFieldElements(field);
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
			} else {
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
		isFieldLocked: (field: Omit<ActiveField, 'uid'>) =>
			Array.from(lockedFields).some(
				(f) => f.field === field.field && f.collection === field.collection && f.primaryKey === field.primaryKey,
			),
	};
}
