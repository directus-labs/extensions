import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { useActiveElement, useEventListener } from '@vueuse/core';
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { getDataFromActiveFieldName } from '../utils';

export function useActiveField(provider: ReturnType<typeof useHocuspocusProvider>) {
	const activeElement = useActiveElement();

	// Watch for element focus changes
	watch(activeElement, (el) => {
		console.log('activeElement', el);

		if (!el) {
			// console.warn('No active element, clearing active field');
			provider.awareness.setActiveField(null);
		}
		else {
			const field = getFieldNameFromElement(el as HTMLElement);
			// console.warn('Active element changed, field:', field, el);
			provider.awareness.setActiveField(field);
		}
	});

	// Handle v-select activation
	useEventListener('mouseup', () => {
		const activeInputEl = document.querySelector('.input.active, .v-input.active, [role="combobox"].active');

		if (activeInputEl && activeElement.value?.getAttribute('data-field')) {
			const field = getFieldNameFromElement(activeInputEl as HTMLElement);

			if (field) {
				const { collection, field: fieldName } = getDataFromActiveFieldName(field);
				console.warn('Mouseup on active input, field:', field, collection, fieldName);
				provider.awareness.setActiveField(field);
			}
		}
	});

	// Clean up awareness state before leaving the page
	useEventListener('beforeunload', () => {
		if (provider.provider.awareness) {
			provider.provider.awareness.destroy();
		}
	});
	/*
	const drawerEmitter = new EventEmitter();

	drawerEmitter.on('drawer-opened', () => {
		provider.awareness.setLocalField('drawerStatus', true);
	});

	drawerEmitter.on('drawer-closed', () => {
		provider.awareness.setLocalField('drawerStatus', false);
	});
*/

	// Clean up awareness state when changing routes
	const router = useRouter();

	router.afterEach((to, from) => {
		if (to.fullPath !== from.fullPath && provider.provider.awareness) {
			provider.provider.awareness.setLocalState(null);
		}
	});

	return {
		setActiveField: (field: string | null) => {
			// console.warn('Manually setting active field:', field);
			provider.awareness.setActiveField(field);
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
	const fieldName = el.dataset.field;
	const collectionName = el.dataset.collection;
	if (fieldName && collectionName) return `${collectionName}:${fieldName}`;

	// Or if any parent has a collection and field attribute
	const parentWithField = el.closest('[data-field], [data-collection]') as HTMLElement | null;

	if (parentWithField) return `${parentWithField.dataset.collection}:${parentWithField.dataset.field}`;

	return null;
}
