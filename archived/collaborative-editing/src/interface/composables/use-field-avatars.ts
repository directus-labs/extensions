import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';
import { ACTIVE_FIELD_SELECTOR } from '../constants';
import { ActiveField, AwarenessItem } from '../types';
import { useSettings } from '../../module/utils/use-settings';

const containerClass = 'field-avatar-container';

interface AppInstance {
	unmount: () => void;
	mount: (container: HTMLElement) => void;
	container?: HTMLElement;
}

export function useFieldAvatars() {
	const apps = ref<AppInstance[]>([]);
	const awarenessStore = useAwarenessStore();
	const { settings } = useSettings();

	function createAvatarForField(activeField: Omit<ActiveField, 'uid'>, states: AwarenessItem[]) {
		const { collection, field, primaryKey } = activeField;
		const fieldKey = `${collection}:${field}:${primaryKey}`;

		const fieldElement = getFieldFromDOM(collection, field, primaryKey);
		if (!fieldElement) {
			return;
		}

		const fieldContainer = fieldElement.closest('.field') || fieldElement;

		// Remove any existing avatar containers for this field
		const existingContainers = fieldContainer.querySelectorAll(`.${containerClass}`);
		existingContainers.forEach((container) => {
			const existingApp = apps.value.find((app) => app.container === container);
			if (existingApp) {
				existingApp.unmount();
				apps.value = apps.value.filter((app) => app !== existingApp);
			}
			container.remove();
		});

		// Filter out current user's avatar if setting is enabled
		let filteredStates = states;
		if (settings.value?.hide_current_user_avatar) {
			filteredStates = states.filter((state) => !state.user.isCurrentUser);
		}

		// Don't create avatar container if no users to show
		if (filteredStates.length === 0) {
			return;
		}

		// Create new container
		const container = document.createElement('div');
		container.classList.add(containerClass);
		container.dataset.fieldKey = fieldKey;

		fieldContainer.appendChild(container);

		// Create the avatar app
		const app = createAppWithDirectus(AvatarStack, {
			users: filteredStates,
		}) as AppInstance;

		app.container = container;
		apps.value.push(app);
		app.mount(container);
	}

	function updateFieldAvatars() {
		// Get all current active fields and group by field key
		const activeFieldsMap = new Map<string, AwarenessItem[]>();

		for (const [, state] of Object.entries(awarenessStore.byUid)) {
			if (!state.activeField) continue;

			const { collection, field, primaryKey } = state.activeField;
			if (!collection || !field || !primaryKey) continue;

			const fieldKey = `${collection}:${field}:${primaryKey}`;

			if (!activeFieldsMap.has(fieldKey)) {
				activeFieldsMap.set(fieldKey, []);
			}
			activeFieldsMap.get(fieldKey)!.push(state);
		}

		// Remove avatars for fields that no longer have active users
		const currentFieldKeys = new Set(activeFieldsMap.keys());
		const appsToRemove: AppInstance[] = [];

		for (const app of apps.value) {
			if (app.container?.dataset.fieldKey) {
				const fieldKey = app.container.dataset.fieldKey;
				if (!currentFieldKeys.has(fieldKey)) {
					app.unmount();
					app.container.remove();
					appsToRemove.push(app);
				}
			}
		}

		// Remove from apps array
		for (const app of appsToRemove) {
			const index = apps.value.indexOf(app);
			if (index > -1) {
				apps.value.splice(index, 1);
			}
		}

		// Create/update avatars for visible active fields
		for (const [fieldKey, states] of activeFieldsMap) {
			const [collection, field, primaryKey] = fieldKey.split(':');

			// Check if field is visible in DOM
			const fieldElement = getFieldFromDOM(collection, field, primaryKey);
			if (fieldElement) {
				// Check if it already has an avatar container
				const existingContainer = fieldElement
					.closest('.field')
					?.querySelector(`.${containerClass}[data-field-key="${fieldKey}"]`);

				if (!existingContainer) {
					// Field is visible but missing avatar, create one
					createAvatarForField({ collection, field, primaryKey }, states);
				}
			}
		}
	}

	function cleanupOrphanedAvatars() {
		// Remove avatars for fields that no longer exist in the DOM
		const appsToRemove: AppInstance[] = [];

		for (const app of apps.value) {
			if (app.container?.dataset.fieldKey) {
				const fieldKey = app.container.dataset.fieldKey;
				const [collection, field, primaryKey] = fieldKey.split(':');

				// Check if the field still exists in DOM
				const fieldElement = getFieldFromDOM(collection, field, primaryKey);
				if (!fieldElement) {
					app.unmount();
					app.container.remove();
					appsToRemove.push(app);
				}
			}
		}

		// Remove from apps array
		for (const app of appsToRemove) {
			const index = apps.value.indexOf(app);
			if (index > -1) {
				apps.value.splice(index, 1);
			}
		}
	}

	// Setup DOM observation for newly added field elements
	function setupDOMObserver() {
		const observer = new MutationObserver((mutations) => {
			let shouldUpdate = false;

			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					const addedNodes = Array.from(mutation.addedNodes);

					// Check if any field elements were added
					for (const node of addedNodes) {
						if (node instanceof HTMLElement) {
							const hasFieldElements =
								node.matches?.(ACTIVE_FIELD_SELECTOR) || node.querySelector?.(ACTIVE_FIELD_SELECTOR);

							if (hasFieldElements) {
								shouldUpdate = true;
								break;
							}
						}
					}

					if (shouldUpdate) break;
				}
			}

			if (shouldUpdate) {
				// Clean up orphaned avatars first
				cleanupOrphanedAvatars();

				// Update avatars with a small delay
				setTimeout(() => {
					updateFieldAvatars();
				}, 50);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		return observer;
	}

	// Set up DOM observer
	const domObserver = setupDOMObserver();

	// Watch for awareness store changes
	watch(
		() => awarenessStore.byUid,
		() => {
			updateFieldAvatars();
		},
		{ deep: true, immediate: true },
	);

	onUnmounted(() => {
		// Clean up all avatar stacks
		for (const app of apps.value) {
			app.unmount();
			if (app.container) {
				app.container.remove();
			}
		}
		apps.value = [];

		// Disconnect DOM observer
		domObserver.disconnect();
	});

	return {
		updateFieldAvatars,
		cleanupOrphanedAvatars,
	};
}
