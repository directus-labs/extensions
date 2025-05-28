import { computed, onMounted, onUnmounted, ref, watch, unref, type ComputedRef } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';
import { useDrawerState } from './use-drawer-state';

const containerClass = 'header-avatars-container';

interface AppInstance {
	unmount: () => void;
	mount: (container: HTMLElement) => void;
	container?: HTMLElement;
}

export function useHeaderAvatars(currentRoom: ComputedRef<string>) {
	const awarenessStore = useAwarenessStore();
	const { isDrawerOpen } = useDrawerState();

	// Create header avatar stack
	const headerApp = ref<AppInstance | null>(null);
	const headerContainer = ref<HTMLElement | null>(null);
	const isCreatingHeader = ref(false);

	// Track the last set of collaborator UIDs to detect actual changes
	const lastCollaboratorUIDs = ref<Set<string>>(new Set());

	// Determine if this instance should be in the drawer or main area
	const isDrawerRoom = computed(() => {
		const roomValue = unref(currentRoom);
		// Check if we're in a drawer by looking for the drawer container that contains our interface
		const currentInterface = document.querySelector(
			`[data-collection="${roomValue.split(':')[0]}"][data-primary-key="${roomValue.split(':')[1]}"]`,
		);
		const isInDrawer = currentInterface?.closest('.v-drawer') !== null;
		return isInDrawer;
	});

	// Filter collaborators by the specific room of this interface instance
	const roomSpecificCollaborators = computed(() => {
		const roomValue = unref(currentRoom);

		const collaborators = Object.values(awarenessStore.byUid).filter((state) => {
			if (!state.user?.rooms || state.user.rooms.size === 0) return false;
			// Only show users who are in this specific room
			const hasRoom = state.user.rooms.has(roomValue);
			return hasRoom;
		});

		return collaborators;
	});

	// Helper function to check if the collaborator list has actually changed
	const hasCollaboratorListChanged = (newCollaborators: typeof roomSpecificCollaborators.value) => {
		const newUIDs = new Set(newCollaborators.map((collab) => collab.user.uid));

		// Compare sizes first (quick check)
		if (newUIDs.size !== lastCollaboratorUIDs.value.size) {
			return true;
		}

		// Compare actual UIDs
		for (const uid of newUIDs) {
			if (!lastCollaboratorUIDs.value.has(uid)) {
				return true;
			}
		}

		return false;
	};

	async function createHeaderAvatars() {
		const roomValue = unref(currentRoom);

		// Prevent concurrent creation
		if (isCreatingHeader.value) return;
		isCreatingHeader.value = true;

		try {
			const mainContainer = document.querySelector('#directus');
			const drawerContainer = document.querySelector('.v-drawer');

			// Clean up existing header container and app for THIS instance only
			if (headerContainer.value) {
				headerContainer.value.remove();
				headerContainer.value = null;
			}

			if (headerApp.value) {
				headerApp.value.unmount();
				headerApp.value = null;
			}

			let titleContainer: HTMLElement | null = null;

			// Use the appropriate container based on whether THIS instance is in the drawer
			if (isDrawerRoom.value && drawerContainer) {
				titleContainer = drawerContainer.querySelector('.title-container');
			} else if (!isDrawerRoom.value && mainContainer) {
				titleContainer = mainContainer.querySelector('.title-container');
			}

			if (!titleContainer) {
				return;
			}

			// Check if there are any collaborators to show
			if (roomSpecificCollaborators.value.length === 0) {
				// Update the tracked UIDs even when there are no collaborators
				lastCollaboratorUIDs.value = new Set();
				return;
			}

			// Remove any existing avatar containers in this title container for this room
			const existingContainers = titleContainer.querySelectorAll(`${containerClass}[data-room="${roomValue}"]`);
			existingContainers.forEach((container) => container.remove());

			const container = document.createElement('div');
			container.classList.add(containerClass);
			container.dataset.room = roomValue; // Add room identifier for debugging
			headerContainer.value = container;

			titleContainer.append(container);

			// Create header stack with room-specific collaborators only
			const app = createAppWithDirectus(AvatarStack, {
				users: roomSpecificCollaborators.value,
			}) as AppInstance;

			headerApp.value = app;
			app.mount(container);

			// Update the tracked collaborator UIDs
			lastCollaboratorUIDs.value = new Set(roomSpecificCollaborators.value.map((collab) => collab.user.uid));
		} catch (error) {
			console.error(`[${roomValue}] Error creating header avatars:`, error);
		} finally {
			isCreatingHeader.value = false;
		}
	}

	// Watch for changes to room-specific collaborators and update the header stack
	watch(
		() => roomSpecificCollaborators.value,
		(newCollaborators) => {
			// Only update if the collaborator list has actually changed
			if (!hasCollaboratorListChanged(newCollaborators)) {
				return;
			}

			// Recreate the header stack when users actually change
			createHeaderAvatars();
		},
		{ deep: true },
	);

	watch(
		() => isDrawerOpen.value,
		() => {
			createHeaderAvatars();
		},
	);

	watch(
		() => currentRoom.value,
		() => {
			// Clean up existing avatars first
			if (headerApp.value) {
				headerApp.value.unmount();
				headerApp.value = null;
			}
			if (headerContainer.value) {
				headerContainer.value.remove();
				headerContainer.value = null;
			}
			// Reset tracked collaborators since we're in a new room
			lastCollaboratorUIDs.value = new Set();
			createHeaderAvatars();
		},
	);

	onMounted(() => {
		// Wait a bit for the DOM to be ready, especially for drawer detection
		setTimeout(() => {
			createHeaderAvatars();
		}, 100);
	});

	onUnmounted(() => {
		// Clean up header avatar stack for THIS instance only
		if (headerApp.value) {
			headerApp.value.unmount();
			headerApp.value = null;
		}

		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}

		// Clear tracked collaborators
		lastCollaboratorUIDs.value = new Set();
	});

	return {
		createHeaderAvatars,
		roomSpecificCollaborators,
	};
}
