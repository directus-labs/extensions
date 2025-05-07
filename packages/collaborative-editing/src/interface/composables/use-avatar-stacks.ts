import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';

interface AppInstance {
	unmount: () => void;
	mount: (container: HTMLElement) => void;
	container?: HTMLElement;
}

export function useAvatarStacks() {
	const apps = ref<AppInstance[]>([]);
	const awarenessStore = useAwarenessStore();

	watch(
		() => awarenessStore.byUid,
		(states) => {
			// Clean up existing avatar stacks
			for (const app of apps.value) {
				app.unmount();
			}

			apps.value = [];

			// Create new avatar stacks for fields with users
			for (const [, state] of Object.entries(states)) {
				if (
					!state.activeField ||
					!state.activeField.collection ||
					!state.activeField.field ||
					!state.activeField.primaryKey
				)
					continue;

				const fieldElement = getFieldFromDOM(
					state.activeField.collection,
					state.activeField.field,
					state.activeField.primaryKey,
				);

				if (!fieldElement) {
					continue;
				}

				// Find the field container
				const fieldContainer = fieldElement.closest('.field') || fieldElement;

				// Find label if it exists
				const fieldLabel = fieldContainer.querySelector('.field-label');

				// Look for existing avatar stack
				let container = fieldContainer.querySelector('.avatar-stack-container') as HTMLElement;
				let existingApp: AppInstance | undefined;

				if (!container) {
					container = document.createElement('div');
					container.classList.add('avatar-stack-container');

					// If field label exists, append to it, otherwise add after the field
					if (fieldLabel) {
						// Insert after the field label text
						const fieldName = fieldLabel.querySelector('.field-name');

						if (fieldName) {
							fieldName.append(container);
						} else {
							fieldLabel.append(container);
						}
					} else {
						// Insert after the field element
						fieldElement.parentElement?.insertBefore(container, fieldElement.nextSibling);
					}
				} else {
					// Find and unmount any existing app in this container
					existingApp = apps.value.find((app) => app.container === container);
					if (existingApp) {
						existingApp.unmount();
						apps.value = apps.value.filter((app) => app !== existingApp);
					}
				}

				// Only show the avatar for the user who has activated this field
				const app = createAppWithDirectus(AvatarStack, {
					users: [state],
					small: true, // Use small avatars to fit better in the field label
				}) as AppInstance;

				// Store the container reference with the app instance
				app.container = container;
				apps.value.push(app);
				app.mount(container);
			}
		},
		{ deep: true },
	);

	// Create header avatar stack
	const headerApp = ref<AppInstance | null>(null);
	const headerContainer = ref<HTMLElement | null>(null);

	function createHeaderAvatarStack() {
		const titleContainer =
			document.querySelector('.title-container') ||
			document.querySelector('.module-bar-title') ||
			document.querySelector('.module-header') ||
			document.querySelector('header');

		if (!titleContainer) {
			return;
		}

		// Clean up existing container if it exists
		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}

		if (headerApp.value) {
			headerApp.value.unmount();
			headerApp.value = null;
		}

		const container = document.createElement('div');
		container.classList.add('avatar-stack-container');
		headerContainer.value = container;

		titleContainer.append(container);

		// Create header stack with all active users
		const app = createAppWithDirectus(AvatarStack, {
			users: awarenessStore.list,
		}) as AppInstance;

		headerApp.value = app;
		app.mount(container);
	}

	// Watch for changes to documentActiveUsers and update the header stack
	watch(
		() => awarenessStore.list,
		() => {
			// Recreate the header stack when users change
			createHeaderAvatarStack();
		},
		{ deep: true },
	);

	// Create initial header stack
	createHeaderAvatarStack();

	onUnmounted(() => {
		// Clean up field avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Clean up header avatar stack
		if (headerApp.value) {
			headerApp.value.unmount();
			headerApp.value = null;
		}

		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}
	});

	return {
		createHeaderAvatarStack,
	};
}
