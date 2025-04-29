import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import Color from 'colorjs.io';
import { watch } from 'vue';
import { findBorderElement, getDataFromActiveFieldName } from '../utils';

export function useFieldBorders(provider: ReturnType<typeof useHocuspocusProvider>) {
	const allFields = new Set<string>();
	const elementsWithBorders = new Set<HTMLElement>();

	// Function to update field borders with a given alpha value
	function updateBorders() {
		const states = provider.groupedByActiveField.value;

		// Get current user and active field
		const self = provider.awareness.local.value;
		const localField = self?.activeField?.field;

		// Track all fields
		for (const state of states) {
			if (state.key) {
				allFields.add(state.key);
			}
		}

		// Clear all field borders first
		for (const element of elementsWithBorders) {
			if (element?.style) {
				element.style.removeProperty('box-shadow');
			}
		}

		elementsWithBorders.clear();

		// Set box-shadow rings for active fields
		for (const state of states) {
			if (!state.key || state.key === localField) continue;

			const fieldData = getDataFromActiveFieldName(state.key);
			if (!fieldData) continue;

			const { collection: fieldCollection, field: fieldName, id } = fieldData;

			// Find the actual field element
			const selector = `[data-field="${fieldName}"][data-collection="${fieldCollection}"][data-id="${id}"]`;
			const fieldElement = document.querySelector(selector) as HTMLElement | null;

			if (!fieldElement) continue;

			// Find the proper element to add the border to
			const el = findBorderElement(fieldCollection, fieldName, id) as HTMLElement | null;

			if (!el?.style || !self) continue;

			const primaryColor = getComputedStyle(document.body).getPropertyValue('--theme--primary');
			const color = new Color(state.user.id === self.user.id ? primaryColor : state.user.color);
			color.alpha = 0.8;

			el.style.boxShadow = `0 0 0 2px ${color.toString()}`;
			elementsWithBorders.add(el);
		}
	}

	watch(() => provider.awareness.all.value, () => {
		updateBorders();
	}, { deep: true, immediate: true });

	return {
		updateFieldBorders: () => updateBorders(),
	};
}
