// src/composables/use-hocuspocus-provider.ts
import { onUnmounted, watch } from 'vue';
import { useCollaborationStore } from '../stores/collaboration';
import { useCurrentUser } from './use-current-user';

export interface UseHocuspocusProviderOptions {
	url: string;
	name: string;
	onAwarenessUpdate?: () => void;
}

export function useHocuspocusProvider(options: UseHocuspocusProviderOptions) {
	// Get the current user
	const currentUser = useCurrentUser();

	// Use the Pinia store
	const collaborationStore = useCollaborationStore();

	// Initialize the provider with the current user
	collaborationStore.initializeProvider({
		...options,
		currentUser: currentUser.value,
	});

	// Watch for current user changes and update the store
	watch(currentUser, (newUser) => {
		if (collaborationStore?.provider?.awareness && newUser) {
			collaborationStore.provider?.setAwarenessField('user', {
				id: newUser.id,
				first_name: newUser.first_name,
				last_name: newUser.last_name,
				avatar: newUser.avatar,
				color: newUser.color,
			});
		}
	});

	// Clean up when component is unmounted
	onUnmounted(() => {
		collaborationStore.destroyProvider();
	});

	// Return the same interface as before, but now using the store
	return {
		doc: collaborationStore.doc,
		values: collaborationStore.values,
		provider: collaborationStore.provider,
		awareness: collaborationStore.documentAwareness,
		globalAwareness: collaborationStore.globalAwareness,
		activeUsers: collaborationStore.activeUsers,
		globalActiveUsers: collaborationStore.globalActiveUsers,
		getUsersBySourceDocument: collaborationStore.getUsersBySourceDocument,
		getUsersByActiveField: collaborationStore.getUsersByActiveField,
		getAllActiveUsers: collaborationStore.getAllActiveUsers,
		groupedByActiveField: collaborationStore.groupedByActiveField,
	};
}
