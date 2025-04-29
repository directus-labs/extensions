// src/composables/use-collaborative-editing.ts
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCollaborationStore } from '../stores/collaboration';
import { useActiveField } from './use-active-field';
import { useAvatarStacks } from './use-avatar-stacks';
import { useCurrentUser } from './use-current-user';
import { useDocumentSync } from './use-document-sync';
import { useFieldBorders } from './use-field-borders';
import { useFieldLocking } from './use-field-locking';

export interface UseCollaborativeEditingOptions {
	/**
	 * The room name for collaboration
	 */
	room: string;
	/**
	 * The WebSocket URL for the collaboration server
	 */
	url?: string;
	/**
	 * Callback called when a field value changes
	 */
	onFieldValueChange: (field: string, value: unknown, collection: string) => void;
}

export function useCollaborativeEditing(options: UseCollaborativeEditingOptions) {
	// Get current user
	const currentUser = useCurrentUser();
	const route = useRoute();

	// Use the Hocuspocus store instead of the provider composable
	const collaborationStore = useCollaborationStore();

	// Initialize the provider through the store
	function initializeProvider() {
		collaborationStore.initializeProvider({
			url: options.url || 'ws://localhost:8055/collaboration/1',
			name: options.room,
			currentUser: currentUser.value,
		});
	}

	// Initialize on mount
	onMounted(initializeProvider);

	// Watch for route changes
	watch(
		() => route.fullPath,
		(newPath, oldPath) => {
			if (newPath !== oldPath) {
				// Destroy existing provider
				collaborationStore.destroyProvider();
				// Reinitialize with new room
				initializeProvider();
			}
		},
	);

	// Extract collection and itemId from room name
	const collection = options.room.split(':')[0] || '';
	const itemId = options.room.split(':')[1] || '';

	const activeField = useActiveField();
	const fieldBorders = useFieldBorders();
	const avatarStacks = useAvatarStacks();
	const fieldLocking = useFieldLocking();
	const documentSync = useDocumentSync({
		onFieldValueChange: options.onFieldValueChange,
	});

	// Initialize avatar stacks on mount
	onMounted(() => {
		avatarStacks.createHeaderAvatarStack();
	});

	return {
		activeField,
		fieldBorders,
		avatarStacks,
		documentSync,
		fieldLocking,
		collection,
		itemId,
		setActiveField: activeField.setActiveField,
		isFieldLocked: fieldLocking.isFieldLocked,
	};
}
