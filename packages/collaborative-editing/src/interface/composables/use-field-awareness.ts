import { onUnmounted } from 'vue';
import { DirectusProvider } from './use-doc';
import { useFieldBorders } from './use-field-borders';
import { useFieldRegistry } from './use-field-registry';
import {
	datetimeFieldHandler,
	drawerFieldHandler,
	selectFieldHandler,
	standardFieldHandler,
	wysiwygFieldHandler,
} from './use-field-registry/handlers';

export function useFieldAwareness(provider: DirectusProvider) {
	// Initialize the field registry (handles both activation and locking)
	const registry = useFieldRegistry(provider);

	// Register all field types and store cleanup functions
	const unregisterStandard = registry.registerHandler(standardFieldHandler);
	const unregisterSelect = registry.registerHandler(selectFieldHandler);
	const unregisterWysiwyg = registry.registerHandler(wysiwygFieldHandler);
	const unregisterDatetime = registry.registerHandler(datetimeFieldHandler);
	const unregisterDrawer = registry.registerHandler(drawerFieldHandler);

	// Set up field borders
	const { updateFieldBorders, cleanup: cleanupBorders } = useFieldBorders();

	// Watch for DOM changes to update borders
	const observer = new MutationObserver(() => {
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
		unregisterDatetime();
		unregisterDrawer();

		// Cleanup other components
		observer.disconnect();
		cleanupBorders();
		registry.cleanup();
	}

	onUnmounted(cleanup);

	return {
		registry,
		cleanup,
		isFieldActive: registry.isFieldActive,
		getActiveHandler: registry.getActiveHandler,
		activeField: registry.activeField,
	};
}
