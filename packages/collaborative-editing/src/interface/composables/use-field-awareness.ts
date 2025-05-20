import { onUnmounted } from 'vue';
import { DirectusProvider } from './use-doc';
import { useFieldRegistry, standardFieldHandler, selectFieldHandler, wysiwygFieldHandler } from './use-field-registry';
import { useFieldLocking } from './use-field-locking';
import { useFieldBorders } from './use-field-borders';

export function useFieldAwareness(provider: DirectusProvider) {
	// Initialize the field registry
	const registry = useFieldRegistry(provider);

	// Register all field types and store cleanup functions
	const unregisterStandard = registry.registerHandler(standardFieldHandler);
	const unregisterSelect = registry.registerHandler(selectFieldHandler);
	const unregisterWysiwyg = registry.registerHandler(wysiwygFieldHandler);

	// Set up field locking and borders
	const { updateFieldLocking } = useFieldLocking();
	const { updateFieldBorders, cleanup: cleanupBorders } = useFieldBorders();

	// Watch for DOM changes to update locking and borders
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

	// Cleanup function
	function cleanup() {
		// Unregister handlers
		unregisterStandard();
		unregisterSelect();
		unregisterWysiwyg();

		// Cleanup other components
		observer.disconnect();
		cleanupBorders();
		registry.cleanup();
	}

	onUnmounted(cleanup);

	return {
		registry,
		cleanup,
		// Utils
		isFieldActive: registry.isFieldActive,
		getActiveHandler: registry.getActiveHandler,
		activeField: registry.activeField,
	};
}
