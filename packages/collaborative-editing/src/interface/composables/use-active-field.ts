import { useActiveElement } from '@vueuse/core';
import { watch } from 'vue';
import { useYJS } from './use-yjs';
import { ACTIVE_FIELD_SELECTOR } from '../constants';

export function useActiveField() {
	const activeElement = useActiveElement();
	const provider = useYJS();
	// Watch for element focus changes
	watch(activeElement, (el) => {
		if (!el) {
			provider.deactivateField();
		} else {
			const fieldParams = getFieldParamsFromElement(el as HTMLElement);
			if (fieldParams) {
				provider.activateField(fieldParams);
			}
		}
	});

	// Handle v-select activation
	/*useEventListener('mouseup', () => {
    const activeInputEl = document.querySelector('.input.active, .v-input.active, [role="combobox"].active');

    if (activeInputEl && activeElement.value?.getAttribute('data-field')) {
      const field = getFieldNameFromElement(activeInputEl as HTMLElement);

      if (field) {
        const fieldData = getDataFromActiveFieldName(field);

        if (fieldData) {
          //	collaborationStore.documentAwareness?.setLocalField('activeField', field ? { field } : null);
        }
      }
    }
  });*/
}

/**
 * Get the field name used for Yjs field sync
 * @param el - The element to get the field name from
 * @returns The field name
 * @example
 * <div data-collection="users" data-field="name" data-primary-key="1">
 *   <input type="text" />
 * </div>
 * getFieldParamsFromElement(el) // { collection: "users", field: "name", primaryKey: "1" }
 */
function getFieldParamsFromElement(el: HTMLElement) {
	// Look for elements with ALL required attributes
	const parentWithField = el.closest(ACTIVE_FIELD_SELECTOR) as HTMLElement | null;

	if (parentWithField) {
		const collection = parentWithField.dataset.collection;
		const field = parentWithField.dataset.field;
		const primaryKey = parentWithField.dataset.primaryKey;

		if (collection && field && primaryKey) {
			return { collection, field, primaryKey };
		}
	}

	return null;
}
