import { onUnmounted, ref, watch, computed } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';
import isEqual from 'lodash-es/isEqual';
import { ActiveField } from '../types';
const containerClass = 'field-avatar-container';

interface AppInstance {
	unmount: () => void;
	mount: (container: HTMLElement) => void;
	container?: HTMLElement;
}

export function useFieldAvatars() {
	const apps = ref<AppInstance[]>([]);
	const awarenessStore = useAwarenessStore();
	const lastActiveFields = ref<{ uid: string; field: ActiveField | null }[]>([]);

	const activeFields = computed(() => {
		return Object.entries(awarenessStore.byUid)
			.filter(([, state]) => state.activeField)
			.map(([uid, state]) => ({
				uid,
				field: state.activeField,
			}));
	});

	function createFieldAvatars() {
		// If the active fields haven't changed, don't recreate the avatars
		if (isEqual(activeFields.value, lastActiveFields.value)) {
			return;
		}

		lastActiveFields.value = activeFields.value;

		// Clean up existing avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Create new avatar stacks for fields with users
		for (const { uid, field } of activeFields.value) {
			if (!field?.collection || !field?.field || !field?.primaryKey) {
				continue;
			}

			const fieldElement = getFieldFromDOM(field.collection, field.field, field.primaryKey);

			if (!fieldElement) {
				continue;
			}

			// Find the field container
			const fieldContainer = fieldElement.closest('.field') || fieldElement;

			// Look for existing avatar stack
			let container = fieldContainer.querySelector(`.${containerClass}`) as HTMLElement;
			let existingApp: AppInstance | undefined;

			if (!container) {
				container = document.createElement('div');
				container.classList.add(containerClass);

				// If field container exists, append to it, otherwise add after the field
				if (fieldContainer) {
					fieldContainer.append(container);
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
				users: [awarenessStore.byUid[uid]],
				small: true, // Use small avatars to fit better in the field label
			}) as AppInstance;

			// Store the container reference with the app instance
			app.container = container;
			apps.value.push(app);
			app.mount(container);
		}
	}

	watch(
		activeFields,
		(newVal, oldVal) => {
			if (isEqual(newVal, oldVal)) {
				return;
			}
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
