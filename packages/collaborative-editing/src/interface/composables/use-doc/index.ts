import { cloneDeep, entries, isEqual } from 'lodash-es';
import { inject, ref, unref, watch } from 'vue';
import * as Y from 'yjs';
import { useAwarenessStore } from '../../stores/awarenessStore';
import { changeCount } from '../../utils/change-count';
import { DirectusProvider } from './provider';

export interface UseYJSOptions {
	onFieldChange?(field: string, value: unknown): void;
}

export { DirectusProvider } from './provider';

export function useDoc(opts: UseYJSOptions = {}) {
	const doc = new Y.Doc();
	const awarenessStore = useAwarenessStore();

	const formValues = inject<Record<string, unknown>>('values') ?? {};
	const initialValues = ref(unref(formValues));
	const edits = ref(unref(formValues));

	// once data is loaded assign initial values
	if (initialValues) {
		watch(
			formValues,
			(v) => {
				initialValues.value = cloneDeep(v);
				edits.value = cloneDeep(v);
			},
			{ once: true },
		);
	}

	const provider = new DirectusProvider({ doc });

	provider.on('doc:update', (field, value) => {
		opts.onFieldChange?.(field, value);
	});

	// Watch for local changes
	if (formValues) {
		watch(
			formValues,
			(changedV) => {
				if (!changedV) return;
				if (isEqual(changedV, edits.value)) return;

				for (const [key, current] of entries(edits.value)) {
					const changeV = changedV[key];

					if (isEqual(current, changeV) || !(key in changedV)) {
						continue;
					}

					// Find the field element and update the timestamp
					let userWithField;
					const fieldEl = document.querySelector(`[data-field="${key}"]`);
					if (fieldEl) {
						const collection = fieldEl.getAttribute('data-collection');
						const primaryKey = fieldEl.getAttribute('data-primary-key');
						if (collection && primaryKey) {
							// Find the user who is editing this specific field
							userWithField = Object.entries(awarenessStore.byUid).find((entry) => {
								const field = entry[1].activeField;
								return (
									field && field.field === key && field.collection === collection && field.primaryKey === primaryKey
								);
							});

							if (userWithField) {
								awarenessStore.updateActiveFieldLastUpdated(userWithField[0]);
							}
						}
					}

					// Only discard changes if it is a discard with no other users changing a field
					const currentUserUid = awarenessStore.getCurrentUser()?.user.uid;
					if (isEqual(changedV, initialValues.value)) {
						// more than one change
						if (changeCount(edits.value, changedV) > 1) return;
						// A user chose discard and no one is editing this field
						if (!userWithField) return;
						// A user chose discard and someone else is editing the field
						if (currentUserUid && userWithField[0] !== currentUserUid) return;
					}

					provider.emit('doc:set', [key, cloneDeep(changeV), 'form']);

					// track edits to later compare against
					edits.value[key] = cloneDeep(changeV);
				}
			},
			{ deep: true },
		);
	}

	return provider;
}
