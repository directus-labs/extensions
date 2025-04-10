import { useSdk, useStores } from '@directus/extensions-sdk';
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
	// Initialize a new YJS doc
	const doc = new Y.Doc();
	const values = doc.getMap('values');
	const awarenessStates = ref<AwarenessState[]>([]);

	// Check if the local user has full read permissions for the users collection. If so, we don't have to worry about filtering the users.
	const { usePermissionsStore } = useStores();
	const sdk = useSdk();
	const permissionsStore = usePermissionsStore();
	const localUserPermissions = permissionsStore.getPermission('directus_users', 'read');

	console.log('localUserPermissions', localUserPermissions);

	const token = sdk.getToken().then((token) => {
		console.log('token', token);
	});

	// Initialize HocuspocusProvider
	const provider = new HocuspocusProvider({
		url: options.url,
		name: options.name,
		document: doc,
		token: '123', // @TODO: Need to pass a token here
		onStatus: ({ status }) => {
			console.warn('Collaboration status:', status);
		},
		onAwarenessChange: (data) => {
			if (!provider.awareness) return;

			console.log('Awareness change', data);

			const states = Array.from(provider.awareness.getStates().values()) as AwarenessState[];
			awarenessStates.value = states;

			// Call the custom handler if provided
			// if (options.onAwarenessUpdate) {
			// 	options.onAwarenessUpdate();
			// }
		},
	});

	// Get current user
	const currentUser = useCurrentUser();

	// Set initial awareness state
	if (provider.awareness && currentUser.value) {
		provider.setAwarenessField('user', {
			id: currentUser.value.id,
			first_name: currentUser.value.first_name,
			last_name: currentUser.value.last_name,
			avatar: currentUser.value.avatar,
			color: currentUser.value.color,
		});
	}

	onUnmounted(() => {
		provider.destroy();
	});

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
