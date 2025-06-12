import { computed, onMounted, onUnmounted, ref, watch, unref, type ComputedRef } from 'vue';
import AvatarStack from '../components/avatar-stack.vue';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useAwarenessStore } from '../stores/awarenessStore';
import { useDrawerState } from './use-drawer-state';
import { isValidRoom } from '../utils';
import sortBy from 'lodash-es/sortBy';
import debounce from 'lodash-es/debounce';

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
	const lastValidRoom = ref<string | null>(null);
	const mountPromise = ref<Promise<void> | null>(null);
	const createTimeout = ref<number | null>(null);

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

	async function cleanupHeader() {
		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}

		if (headerApp.value) {
			try {
				headerApp.value.unmount();
			} catch (error) {
				console.warn('[Header Avatars] Error unmounting app:', error);
			}
			headerApp.value = null;
		}
	}

	async function createHeaderAvatars() {
		const roomValue = unref(currentRoom);

		// Clear any pending create timeout
		if (createTimeout.value) {
			window.clearTimeout(createTimeout.value);
			createTimeout.value = null;
		}

		// Skip if we're already creating headers
		if (isCreatingHeader.value) {
			return;
		}

		// Skip if this is an invalid room
		if (!isValidRoom(roomValue)) {
			return;
		}

		// Skip if this is the same room AND the number of collaborators hasn't changed
		if (
			roomValue === lastValidRoom.value &&
			roomSpecificCollaborators.value.length === lastCollaboratorUIDs.value.size
		) {
			return;
		}

		isCreatingHeader.value = true;

		try {
			// Wait for any existing mount operation to complete
			if (mountPromise.value) {
				await mountPromise.value;
			}

			// Clean up existing header
			await cleanupHeader();

			const mainContainer = document.querySelector('#directus');
			const drawerContainer = document.querySelector('.v-drawer');

			let titleContainer: HTMLElement | null = null;

			// Use the appropriate container based on whether THIS instance is in the drawer
			if (isDrawerRoom.value && drawerContainer) {
				titleContainer = drawerContainer.querySelector('.title-container');
				// Remove any existing avatar containers in the drawer
				const existingDrawerContainers = drawerContainer.querySelectorAll(`.${containerClass}`);
				existingDrawerContainers.forEach((container) => container.remove());
			} else if (!isDrawerRoom.value && mainContainer) {
				titleContainer = mainContainer.querySelector('.title-container');
				// Remove any existing avatar containers in the main container
				const existingMainContainers = mainContainer.querySelectorAll(`.${containerClass}`);
				existingMainContainers.forEach((container) => container.remove());
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

			const container = document.createElement('div');
			container.classList.add(containerClass);
			container.dataset.room = roomValue; // Add room identifier for debugging
			headerContainer.value = container;

			titleContainer.append(container);

			// Create header stack with room-specific collaborators only
			// We are just sorting them so that the order is consistent and the avatars don't get shuffled when unmounting/remounting
			const sortedUsers = sortBy(
				[...roomSpecificCollaborators.value],
				[
					(collab) => (collab.user.first_name ? collab.user.first_name.toLowerCase() : undefined),
					(collab) => (collab.user.first_name ? 0 : 1), // Place those without first_name at the end
				],
			);
			const app = createAppWithDirectus(AvatarStack, {
				users: sortedUsers,
			}) as AppInstance;

			headerApp.value = app;

			// Create a promise for the mount operation
			mountPromise.value = new Promise((resolve) => {
				app.mount(container);
				resolve();
			});

			await mountPromise.value;
			mountPromise.value = null;

			// Update the tracked collaborator UIDs and last valid room
			lastCollaboratorUIDs.value = new Set(roomSpecificCollaborators.value.map((collab) => collab.user.uid));
			lastValidRoom.value = roomValue;
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

			debouncedCreateHeaderAvatars();
		},
		{ deep: true },
	);

	const debouncedCreateHeaderAvatars = debounce(createHeaderAvatars, 100);

	// Initialize header avatars after a short delay to ensure DOM is ready
	const initializeHeaderAvatars = () => {
		setTimeout(() => {
			debouncedCreateHeaderAvatars();
		}, 100);
	};

	watch(
		() => isDrawerOpen.value,
		() => {
			debouncedCreateHeaderAvatars();
		},
	);

	watch(
		() => currentRoom.value,
		() => {
			// Clean up existing avatars first
			if (headerApp.value) {
				try {
					headerApp.value.unmount();
				} catch (error) {
					console.warn('Error unmounting header avatars:', error);
				}
				headerApp.value = null;
			}
			if (headerContainer.value) {
				headerContainer.value.remove();
				headerContainer.value = null;
			}
			// Reset tracked collaborators since we're in a new room
			lastCollaboratorUIDs.value = new Set();
			debouncedCreateHeaderAvatars();
		},
	);

	onMounted(() => {
		initializeHeaderAvatars();
	});

	onUnmounted(() => {
		debouncedCreateHeaderAvatars.cancel();
		cleanupHeader();
		// Clear tracked collaborators
		lastCollaboratorUIDs.value = new Set();
	});

	return {
		createHeaderAvatars,
		roomSpecificCollaborators,
	};
}
