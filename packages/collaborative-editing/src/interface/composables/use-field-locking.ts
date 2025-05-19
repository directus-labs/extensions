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
				lastUpdated: state.activeField.lastUpdated,
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

	function findFieldInputElement(el: HTMLElement): HTMLElement[] {
		const inputs = el.querySelectorAll(
			'.interface > *:first-child,.interface input,.interface .input,.interface textarea,.interface select,.interface [contenteditable="true"]',
		);
		return Array.from(inputs).filter((i) => i instanceof HTMLElement);
	}

	function lockField(field: Omit<ActiveField, 'uid'>) {
		const elements = findFieldElements(field);
		for (const el of elements) {
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
	}

	function unlockField(field: Omit<ActiveField, 'uid'>) {
		const elements = findFieldElements(field);
		for (const el of elements) {
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
	}

	return {
		updateFieldLocking,
		isFieldLocked: (field: Omit<ActiveField, 'uid'>) =>
			Array.from(lockedFields).some(
				(f) => f.field === field.field && f.collection === field.collection && f.primaryKey === field.primaryKey,
			),
	};
}
