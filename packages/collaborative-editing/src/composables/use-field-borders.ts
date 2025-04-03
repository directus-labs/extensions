import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import Color from 'colorjs.io';
import { watch } from 'vue';
import { findBorderElement } from '../utils/find-border-element';

export function useFieldBorders(provider: ReturnType<typeof useHocuspocusProvider>) {
	const allFields = new Set<string>();
	const elementsWithBorders = new Set<HTMLElement>();

	// Function to update field borders with a given alpha value
	function updateBorders() {
		const states = provider.awareness.all.value;

		// Get current user and active field
		const self = provider.awareness.local.value;
		const localField = self?.activeField?.field;

		// Track all fields
		for (const state of states) {
			if (state.activeField?.field) {
				allFields.add(state.activeField.field);
			}
		}

		// Clear all field borders first
		for (const field of allFields) {
			const el = findBorderElement(field) as HTMLElement | null;

			if (el?.style) {
				el.style.removeProperty('box-shadow');
			}
		}

		// Set box-shadow rings for active fields
		for (const state of states) {
			if (!state.activeField?.field || state.activeField.field === localField) continue;

			const el = findBorderElement(state.activeField.field) as HTMLElement | null;

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
