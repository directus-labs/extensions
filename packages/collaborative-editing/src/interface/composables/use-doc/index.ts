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

	const formValues = inject<Record<string, unknown>>('values')!;

	const initialValues = ref(unref(formValues));

	// once data is loaded assign initial values
	if (initialValues) {
		watch(
			formValues,
			(v) => {
				initialValues.value = v;
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
			(changedV, currentV) => {
				if (!currentV || !changedV) return;
				if (isEqual(changedV, currentV)) return;
				// change will only ever be one aside from when we discard
				if (isEqual(changedV, currentV) && changeCount(currentV, changedV) > 1) return;

				for (const [key, current] of entries(currentV)) {
					const changeV = changedV[key];

					if (isEqual(current, changeV)) {
						continue;
					}

					provider.emit('doc:set', [cloneDeep(key), cloneDeep(changeV), 'form']);

					// Find the field element and update the timestamp
					const fieldEl = document.querySelector(`[data-field="${key}"]`);
					if (fieldEl) {
						const collection = fieldEl.getAttribute('data-collection');
						const primaryKey = fieldEl.getAttribute('data-primary-key');
						if (collection && primaryKey) {
							const awarenessStore = useAwarenessStore();
							awarenessStore.updateActiveFieldLastUpdated({
								collection,
								field: key,
								primaryKey,
							});
						}
					}
				}
			},
			{ deep: true },
		);
	}

	return provider;
}
