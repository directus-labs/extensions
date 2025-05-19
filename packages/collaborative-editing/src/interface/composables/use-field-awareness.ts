import { onUnmounted } from 'vue';
import { DirectusProvider } from './use-doc';
import { useActiveField } from './use-active-field';
import { useWysiwygFields } from './use-wysiwyg-fields';
import { useFieldLocking } from './use-field-locking';
import { useFieldBorders } from './use-field-borders';

export function useFieldAwareness(provider: DirectusProvider) {
	// Set up standard active field tracking
	useActiveField(provider);

	// Set up wysiwyg field tracking
	useWysiwygFields(provider);

	// Set up field locking
	const { updateFieldLocking } = useFieldLocking();

	// Set up field borders
	const { updateFieldBorders, cleanup: cleanupBorders } = useFieldBorders();

	const observer = new MutationObserver(() => {
		updateFieldLocking();
		updateFieldBorders();
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});

	onUnmounted(() => {
		observer.disconnect();
		cleanupBorders();
	});

	return {
		cleanup: () => {
			observer.disconnect();
			cleanupBorders();
		},
	};
}
