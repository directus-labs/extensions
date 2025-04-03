import { HocuspocusProvider } from '@hocuspocus/provider';
import { computed, onUnmounted, ref } from 'vue';
import * as Y from 'yjs';
import { useCurrentUser } from './use-current-user';

interface User {
	id: string;
	color: string;
	first_name: string;
	last_name: string;
	avatar?: {
		id: string;
	};
}

interface AwarenessState {
	user: User;
	activeField?: {
		field: string;
	};
}

export interface UseHocuspocusProviderOptions {
	url: string;
	name: string;
	onAwarenessUpdate?: () => void;
}

export function useHocuspocusProvider(options: UseHocuspocusProviderOptions) {
	// Initialize YJS doc
	const doc = new Y.Doc();
	const values = doc.getMap('values');
	const awarenessStates = ref<AwarenessState[]>([]);

	// Initialize HocuspocusProvider
	const provider = new HocuspocusProvider({
		url: options.url,
		name: options.name,
		document: doc,
		onStatus: ({ status }) => {
			console.warn('Collaboration status:', status);
		},
		onAwarenessUpdate: () => {
			if (!provider.awareness) return;

			const states = Array.from(provider.awareness.getStates().values()) as AwarenessState[];
			awarenessStates.value = states;

			// Call the custom handler if provided
			if (options.onAwarenessUpdate) {
				options.onAwarenessUpdate();
			}
		},
	});

	// Get current user
	const currentUser = useCurrentUser();

	// Set initial awareness state
	if (provider.awareness && currentUser.value) {
		provider.awareness.setLocalState({
			user: {
				id: currentUser.value.id,
				color: currentUser.value.color,
				first_name: currentUser.value.first_name,
				last_name: currentUser.value.last_name,
				avatar: currentUser.value.avatar,
			},
		});
	}

	// Clean up on unmount
	onUnmounted(() => {
		provider.destroy();
	});

	// Computed properties for awareness
	const activeUsers = computed(() => {
		return awarenessStates.value.map((state) => state.user);
	});

	const awareness = {
		local: computed(() => {
			return provider.awareness?.getLocalState() as AwarenessState | null;
		}),
		others: computed(() => {
			return awarenessStates.value.filter((state) =>
				state.user?.id !== currentUser.value?.id,
			);
		}),
		all: computed(() => {
			return awarenessStates.value;
		}),
		setLocalField: <T>(field: string, value: T) => {
			if (!provider.awareness) return;
			provider.awareness.setLocalStateField(field, value);
		},
		setActiveField: (field: string | null) => {
			if (!provider.awareness) return;
			provider.awareness.setLocalStateField('activeField', { field });
		},
	};

	return {
		doc,
		values,
		provider,
		awareness,
		activeUsers,
	};
}
