import type { Ref } from 'vue';
import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { cloneDeep, isEqual } from 'lodash-es';
import { inject, ref, watch } from 'vue';
import { diffObjects } from '../utils/diff-objects';

export interface UseDocumentSyncOptions {
	/**
	 * Callback called when field values change
	 */
	onFieldValueChange: (field: string, value: unknown) => void;
}

export function useDocumentSync(
	provider: ReturnType<typeof useHocuspocusProvider>,
	options: UseDocumentSyncOptions,
) {
	const values = inject<Ref<Record<string, unknown>>>('values');
	const updatingFromYJS = ref(false);
	const formValues = provider.doc.getMap('values');

	// Handle updates from YJS
	formValues.observe((event) => {
		if (updatingFromYJS.value) return;

		updatingFromYJS.value = true;
		const keys = Array.from(event.changes.keys.keys());

		for (const key of keys) {
			const change = event.changes.keys.get(key);

			if (change && (change.action === 'add' || change.action === 'update')) {
				options.onFieldValueChange(key, formValues.get(key));
			}
		}

		setTimeout(() => {
			updatingFromYJS.value = false;
		}, 50);
	});

	// Watch for local changes
	if (values) {
		watch(values, (newValues, oldValues) => {
			if (updatingFromYJS.value) return;
			if (!newValues || !oldValues) return;
			if (isEqual(newValues, oldValues)) return;

			const diff = diffObjects(oldValues, newValues);

			for (const { field, newValue } of diff) {
				// @TODO: This shit ain't working. Only sync non-empty changes to prevent discard issues
				if (newValue !== undefined && newValue !== null) {
					formValues.set(field, cloneDeep(newValue));
				}
			}
		}, { deep: true });
	}

	return {
		setActiveField: (field: string | null) => {
			provider.awareness.setLocalField('activeField', field ? { field } : null);
		},
		updatingFromYJS,
	};
}
