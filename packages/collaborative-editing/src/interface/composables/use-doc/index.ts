import * as l from 'lodash-es';
import { inject, watch } from 'vue';
import * as Y from 'yjs';
import { DirectusProvider } from './provider';

export interface UseYJSOptions {
	onFieldChange?(field: string, value: unknown): void;
}

export { DirectusProvider } from './provider';

export function useDoc(opts: UseYJSOptions = {}) {
	const doc = new Y.Doc();

	const formValues = inject<Record<string, unknown>>('values')!;
	const provider = new DirectusProvider({ doc });

	provider.on('doc:update', (field, value) => {
		opts.onFieldChange?.(field, value);
	});

	// Watch for local changes
	if (formValues) {
		watch(
			formValues,
			(changedV, currentV) => {
				provider.emit('debug', ['formValues:raw', [changedV, currentV]]);
				if (!currentV || !changedV) return;
				if (l.isEqual(changedV, currentV)) return;

				for (const [key, current] of l.entries(currentV)) {
					const changeV = changedV[key];

					if (l.isEqual(current, changeV)) {
						continue;
					}

					if (changeV !== undefined && changeV !== null && key) {
						provider.emit('debug', ['docMap:set', [key, changeV]]);
						provider.emit('doc:set', [l.cloneDeep(key), l.cloneDeep(changeV)]);
					}
				}
			},
			{ deep: true },
		);
	}

	return provider;
}
