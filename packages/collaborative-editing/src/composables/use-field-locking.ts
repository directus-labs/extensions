import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { onMounted, watch } from 'vue';
import { getDataFromActiveFieldName } from '../utils';

// const relatedSelectors = ['.many-to-many', '.many-to-one', '.one-to-many', '.one-to-one'];
export function useFieldLocking(provider: ReturnType<typeof useHocuspocusProvider>) {
	const lockedFields = new Set<string>();

	// Watch for changes in awareness states
	watch(() => {
		return provider.groupedByActiveField.value;
	}, updateFieldLocking, { deep: true });

	// Initialize on mount
	onMounted(updateFieldLocking);

	function updateFieldLocking() {
		const states = provider.groupedByActiveField.value;
		const self = provider.awareness.local.value;
		const currentUserId = self?.user?.id;

		// First determine which fields should be locked
		const fieldsToLock = new Set<string>();

		for (const state of states) {
			// Skip if this is the current user
			if (state.user?.id === currentUserId) continue;

			// Skip if no active field
			if (!state.key) continue;

			// Add to fields that should be locked
			fieldsToLock.add(state.key);
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

	function findFieldElements(collectionName: string, fieldName: string, id: string): HTMLElement[] {
		// Find elements by data attribute, name attribute, etc.
		const selectors = [
			`[data-collection="${collectionName}"][data-field="${fieldName}"][data-id="${id}"]`,
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

	/**
	 * Check if a field is a related field
	 */
	/* function fieldIsRelatedField(
		field: Field,
		collection: string,
		allowedTypes: Array<'m2o' | 'o2m' | 'm2a' | null> = ['m2o', 'o2m', 'm2a'],
	) {
		const { fieldsStore, relationsStore } = useStores();
		const field = fieldsStore.fields.find((field) => field.field === fieldName);
		const relation = relationsStore.relations.find((relation) =>
			allowedTypes.includes(getRelationType({ relation, collection: collection.value, field: field.field })),
		);

		return !!relation;
	} */

	function lockField(activeFieldName: string) {
		const fieldData = getDataFromActiveFieldName(activeFieldName);
		if (!fieldData) return;

		const { collection: fieldCollection, field: fieldName, id } = fieldData;
		// const isRelatedField = fieldIsRelatedField({ name: fieldName }, fieldCollection, ['m2o', 'o2m', 'm2a']);
		const elements = findFieldElements(fieldCollection, fieldName, id);

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

	function unlockField(activeFieldName: string) {
		const fieldData = getDataFromActiveFieldName(activeFieldName);
		if (!fieldData) return;

		const { collection: fieldCollection, field: fieldName, id } = fieldData;
		const elements = findFieldElements(fieldCollection, fieldName, id);

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
