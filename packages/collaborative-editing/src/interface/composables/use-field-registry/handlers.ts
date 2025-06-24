import { FieldHandler } from './types';

// Handler for simple input fields that can be focused
export const standardFieldHandler: FieldHandler = {
	name: 'standard',
	detect: (el) => el.matches('input, textarea, select, [contenteditable], canvas[class^=map],.file button'),
	activation: {
		type: 'focus',
	},

	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: false, // No need for this. Focus handles this automatically
	},
};

export const selectFieldHandler: FieldHandler = {
	name: 'select',
	detect: (el) => el.matches('.v-select .input'),
	activation: {
		type: 'class',
		className: 'active',
	},
	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: true,
		ignoreClickSelectors: ['.v-select', '.v-overlay'],
	},
};

export const wysiwygFieldHandler: FieldHandler = {
	name: 'wysiwyg',
	detect: (el) => el.matches('.tox-tinymce'),
	activation: {
		type: 'class',
		className: 'focus',
	},
	deactivation: {
		debounceMs: 100,
		checkOnDocumentClick: true,
		ignoreClickSelectors: ['.tox-toolbar', '.tox-menubar', '.tox-sidebar', '.tox-dialog', '.tox-tinymce'],
	},
	onBeforeDeactivate: () => {
		// If window doesn't have focus, prevent deactivation
		if (!document.hasFocus()) {
			return false; // Prevent deactivation
		}
		return true; // Allow normal deactivation logic
	},
};

export const datetimeFieldHandler: FieldHandler = {
	name: 'datetime',
	detect: (el) => el.matches('.v-menu:not(.v-select) .v-input .input'),
	activation: {
		type: 'class',
		className: 'active',
	},
	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: true,
		ignoreClickSelectors: ['.v-menu', '.v-overlay', '.flatpickr-calendar'],
	},
};

export const drawerFieldHandler: FieldHandler = {
	name: 'drawer',
	detect: (el) => el.matches('.collection-item-dropdown>button'),
	activation: {
		type: 'focus',
	},
	deactivation: {
		debounceMs: 50,
		checkOnDocumentClick: true,
		ignoreDrawerSelection: true,
	},
};
