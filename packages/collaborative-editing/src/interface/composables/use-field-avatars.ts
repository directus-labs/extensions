import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';
const containerClass = 'field-avatar-container';

interface AppInstance {
	unmount: () => void;
	mount: (container: HTMLElement) => void;
	container?: HTMLElement;
}

export function useFieldAvatars() {
	const apps = ref<AppInstance[]>([]);
	const awarenessStore = useAwarenessStore();

	function createFieldAvatars() {
		// Clean up existing avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Create new avatar stacks for fields with users
		for (const [, state] of Object.entries(awarenessStore.byUid)) {
			// Skip users without active fields
			if (!state.activeField) {
				continue;
			}

			if (!state.activeField.collection || !state.activeField.field || !state.activeField.primaryKey) {
				continue;
			}

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
			let container = fieldContainer.querySelector(`.${containerClass}`) as HTMLElement;
			let existingApp: AppInstance | undefined;

			if (!container) {
				container = document.createElement('div');
				container.classList.add(containerClass);

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
					console.log('existing app found and unmounting');
					existingApp.unmount();
					apps.value = apps.value.filter((app) => app !== existingApp);
				}
			}

			console.log('creating app');
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
	}

	watch(
		() => awarenessStore.byUid,
		() => {
			createFieldAvatars();
		},
		{ deep: true },
	);

	onUnmounted(() => {
		// Clean up field avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];
	});

	return {
		createFieldAvatars,
	};
}
