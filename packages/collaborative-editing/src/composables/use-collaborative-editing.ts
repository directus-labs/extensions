import { onMounted } from 'vue';
import { useActiveField } from './use-active-field';
import { useAvatarStacks } from './use-avatar-stacks';
import { useDocumentSync } from './use-document-sync';
import { useFieldBorders } from './use-field-borders';
import { useFieldLocking } from './use-field-locking';
import { useHocuspocusProvider } from './use-hocuspocus-provider';

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
	// Initialize the Hocuspocus provider
	const provider = useHocuspocusProvider({
		url: options.url || 'ws://localhost:8055/collaboration/1',
		name: options.room,
	});

	const collection = options.room.split(':')[0] || '';
	const itemId = options.room.split(':')[1] || '';

	const activeField = useActiveField(provider);

	const fieldBorders = useFieldBorders(provider, collection);

	const avatarStacks = useAvatarStacks(provider);

	const fieldLocking = useFieldLocking(provider, collection);

	const documentSync = useDocumentSync(provider, {
		onFieldValueChange: options.onFieldValueChange,
	});

	onMounted(() => {
		avatarStacks.createHeaderAvatarStack();
	});

	return {
		provider,
		activeField,
		fieldBorders,
		avatarStacks,
		documentSync,
		fieldLocking,
		collection,
		itemId,
		setActiveField: activeField.setActiveField,
		// updateFieldValue: documentSync.updateFieldValue,
		isFieldLocked: fieldLocking.isFieldLocked,
	};
}
