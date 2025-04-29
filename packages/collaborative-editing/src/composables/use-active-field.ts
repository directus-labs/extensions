import { useActiveElement, useEventListener } from '@vueuse/core';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCollaborationStore } from '../stores/collaboration';
import { getDataFromActiveFieldName } from '../utils';

export function useActiveField() {
	const activeElement = useActiveElement();
	const collaborationStore = useCollaborationStore();

	// Watch for element focus changes
	watch(activeElement, (el) => {
		if (!el) {
			collaborationStore.documentAwareness?.setLocalField('activeField', null);
		}
		else {
			const field = getFieldNameFromElement(el as HTMLElement);
			collaborationStore.documentAwareness?.setLocalField('activeField', field ? { field } : null);
		}
	});

	// Handle v-select activation
	useEventListener('mouseup', () => {
		const activeInputEl = document.querySelector('.input.active, .v-input.active, [role="combobox"].active');

		if (activeInputEl && activeElement.value?.getAttribute('data-field')) {
			const field = getFieldNameFromElement(activeInputEl as HTMLElement);

			if (field) {
				const fieldData = getDataFromActiveFieldName(field);

				if (fieldData) {
					const { collection, field: fieldName } = fieldData;
					console.warn('Mouseup on active input, field:', field, collection, fieldName);
					collaborationStore.documentAwareness?.setLocalField('activeField', field ? { field } : null);
				}
			}
		}
	});

	// Clean up awareness state before leaving the page
	useEventListener('beforeunload', () => {
		if (collaborationStore.provider?.awareness) {
			collaborationStore.provider.awareness.destroy();
		}
	});

	// Clean up awareness state when changing routes
	const router = useRouter();

	router.afterEach((to, from) => {
		if (to.fullPath !== from.fullPath && collaborationStore.provider?.awareness) {
			collaborationStore.provider.awareness.setLocalState(null);
		}
	});

	return {
		setActiveField: (field: string | null) => {
			collaborationStore.documentAwareness?.setLocalField('activeField', field ? { field } : null);
		},
	};
}

/**
 * Get the field name used for Yjs field sync
 * @param el - The element to get the field name from
 * @returns The field name
 * @example
 * <div data-field="name" data-collection="users">
 *   <input type="text" />
 * </div>
 * getFieldNameFromElement(el) // "users:name"
 */
function getFieldNameFromElement(el: HTMLElement) {
	// Check if the element itself has a field attribute
	/* const fieldName = el.dataset.field;
	const collectionName = el.dataset.collection;
	if (fieldName && collectionName) return `${collectionName}:${fieldName}`; */

	// Or if any parent has a collection and field attribute
	const parentWithField = el.closest('[data-field], [data-collection], [data-id]') as HTMLElement | null;

	if (parentWithField) return `${parentWithField.dataset.collection}:${parentWithField.dataset.field}:${parentWithField.dataset.id}`;

	return null;
}
