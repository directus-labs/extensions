// src/composables/use-collaborative-editing.ts
import type { User } from '../types';
import { onMounted, watch } from 'vue';
import { useCollaborationStore } from '../stores/collaboration';
import { useActiveField } from './use-active-field';
import { useAvatarStacks } from './use-avatar-stacks';
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
	url: string;
	/**
	 * The current user for collaboration
	 */
	currentUser?: User;
	/**
	 * Callback called when a field value changes
	 */
	onFieldValueChange: (field: string, value: unknown, collection: string) => void;
}

export function useCollaborativeEditing(options: UseCollaborativeEditingOptions) {
	// Use the Hocuspocus store instead of the provider composable
	const collaborationStore = useCollaborationStore();

	// Initialize the provider through the store
	function initializeProvider() {
		collaborationStore.initializeProvider({
			url: options.url || 'ws://localhost:8055/collaboration/1',
			name: options.room,
			currentUser: options.currentUser,
		});
	}

	// Initialize on mount
	onMounted(initializeProvider);

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
