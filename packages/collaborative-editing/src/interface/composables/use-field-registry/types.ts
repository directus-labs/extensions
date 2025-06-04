import type { FieldMeta } from '../use-field-meta';

export interface FieldHandler {
	name: string;
	// Detect if the element is a field
	detect: (el: HTMLElement) => boolean;

	// Activation detection
	activation: {
		type: 'focus' | 'class' | 'custom';
		className?: string;
		customCheck?: (el: HTMLElement) => boolean;
	};

	// Hooks
	onBeforeActivate?: (el: HTMLElement, fieldMeta: FieldMeta) => boolean; // return false to prevent
	onAfterActivate?: (el: HTMLElement, fieldMeta: FieldMeta) => void;
	onBeforeDeactivate?: (el: HTMLElement, fieldMeta: FieldMeta) => boolean; // return false to prevent
	onAfterDeactivate?: (el: HTMLElement, fieldMeta: FieldMeta) => void;

	// Deactivation settings
	deactivation: {
		debounceMs?: number;
		checkOnDocumentClick?: boolean;
		// Selectors to ignore when checking document clicks
		// One example is the TinyMCE toolbar, which should not be considered a deactivation trigger
		ignoreClickSelectors?: string[];
	};
}

export interface ActiveField {
	element: HTMLElement;
	fieldMeta: FieldMeta;
	handler: FieldHandler;
}
