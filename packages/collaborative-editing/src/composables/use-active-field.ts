import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { useActiveElement, useEventListener } from '@vueuse/core';
import { watch } from 'vue';
import { useRouter } from 'vue-router';

export function useActiveField(provider: ReturnType<typeof useHocuspocusProvider>) {
	const activeElement = useActiveElement();

	// Watch for element focus changes
	watch(activeElement, (el) => {
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

		if (activeInputEl) {
			const field = getFieldNameFromElement(activeInputEl as HTMLElement);
			// console.warn('Mouseup on active input, field:', field);

			if (field) {
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

function getFieldNameFromElement(el: HTMLElement) {
	// Check if the element itself has a field attribute
	const fieldAttr = el.getAttribute('field');
	if (fieldAttr) return fieldAttr;

	// Or if any parent has a field attribute
	const parentWithField = el.closest('[field]');
	if (parentWithField) return parentWithField.getAttribute('field');

	return null;
}
