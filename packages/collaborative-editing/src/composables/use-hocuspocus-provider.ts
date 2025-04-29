import type { ComputedRef } from 'vue';
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

type AwarenessType = 'local-awareness' | 'global-awareness';

interface Awareness {
	type: AwarenessType;
	sourceDocument: string;
	states: AwarenessState[];
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
	const globalAwarenessRef = ref<Awareness | null>(null);
	const localAwarenessRef = ref<Awareness | null>(null);

	// Initialize HocuspocusProvider
	const provider = new HocuspocusProvider({
		url: options.url,
		name: options.name,
		document: doc,
		token: '123', // @TODO: Need to pass a token here
		onStatus: ({ status }) => {
			console.info('Collaboration status:', status);
		},
		onAwarenessChange: () => {
			if (!provider.awareness) return;

			const states = Array.from(provider.awareness.getStates().values()) as AwarenessState[];
			awarenessStates.value = states;

			const newStates = states.map((state: AwarenessState) => {
				const existingState = localAwarenessRef.value?.states.find((s) => s.user.id === state.user.id);
				return existingState ? { ...existingState, ...state } : state;
			});

			const newAwarenessState: Awareness = {
				type: 'local-awareness',
				sourceDocument: options.name,
				states: newStates,
			};

			localAwarenessRef.value = newAwarenessState;
		},
		onStateless: ({ payload }) => {
			try {
				const message = JSON.parse(payload);

				if (message.type === 'global-awareness') {
					// spread message.states into the state with matching user.id
					const newStates = message.states.map((state: AwarenessState) => {
						const existingState = globalAwarenessRef.value?.states.find((s) => s.user.id === state.user.id);

						if (message?.sourceDocument === message.sourceDocument) {
							return { ...existingState, ...state };
						}

						return existingState;
					});

					const newGlobalAwareness: Awareness = {
						type: 'global-awareness',
						sourceDocument: globalAwarenessRef.value?.sourceDocument ?? message.sourceDocument,
						states: newStates,
					};

					globalAwarenessRef.value = newGlobalAwareness;
				}
			}
			catch (error) {
				console.error('Failed to process awareness update:', error);
			}
		},
	});

	function getUsersBySourceDocument(
		awarenessArray: Awareness[],
		sourceDocument: string,
	): User[] {
		const users: Map<string, User> = new Map();

		awarenessArray
			.filter((item) => item.sourceDocument === sourceDocument)
			.forEach((item) => {
				item.states.forEach((state) => {
					// Only add this user if they haven't been added already
					if (!users.has(state.user.id)) {
						users.set(state.user.id, state.user);
					}
				});
			});

		return Array.from(users.values());
	}

	function getAllActiveUsers(
		awarenessArray: Awareness[],
	): User[] {
		const users: Map<string, User> = new Map();

		awarenessArray.forEach((item) => {
			item.states.forEach((state) => {
				// Only add this user if they haven't been added already
				if (!users.has(state.user.id)) {
					users.set(state.user.id, state.user);
				}
			});
		});

		return Array.from(users.values());
	}

	// Utility function to get users with a specific activeField value
	function getUsersByActiveField(
		awarenessArray: Awareness[],
		fieldValue: string,
	): User[] {
		// Filter the array to only include items with states that have the matching activeField
		// Then map to extract just the users, eliminating duplicates by user ID
		const users: Map<string, User> = new Map();

		awarenessArray.forEach((item) => {
			item.states.forEach((state) => {
				if (state.activeField && state.activeField.field === fieldValue // Only add this user if they haven't been added already
					&& !users.has(state.user.id)) {
					users.set(state.user.id, state.user);
				}
			});
		});

		return Array.from(users.values());
	}

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
		const awarenessArray = [];
		if (globalAwarenessRef.value) awarenessArray.push(globalAwarenessRef.value);
		if (localAwarenessRef.value) awarenessArray.push(localAwarenessRef.value);

		const users = getAllActiveUsers(awarenessArray);
		return users;
	});

	const globalActiveUsers = computed(() => {
		return globalAwarenessRef.value?.states.map((state) => state.user);
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

	const globalAwareness: {
		all: ComputedRef<AwarenessState[]>;
		others: ComputedRef<AwarenessState[]>;
	} = {
		all: computed(() => {
			const globalStates = globalAwarenessRef.value?.states || [];
			return globalStates;
		}),
		others: computed(() => {
			return globalAwareness.all.value.filter((state: AwarenessState) => state.user.id !== currentUser.value?.id);
		}),
	};

	/*
		@param {AwarenessState[]} awarenessArray
		@return[
			{
				key: 'directus_users:title:1',
				field: 'title',
				collection: 'directus_users',
				id: '1',
				user: {
					id: '1',
					first_name: 'John',
					last_name: 'Doe',
					avatar: 'https://example.com/avatar.png',
					color: '#000000',
				},
			}
		]
	*/
	const groupedByActiveField = computed(() => {
		// Combine local and global awareness states
		const localStates = awareness.all.value;
		const globalStates = globalAwareness.all.value;
		const allStates = [...localStates, ...globalStates];

		// Create a map to store unique active fields by their key
		const activeFieldsMap = new Map<string, {
			key: string;
			field: string;
			collection: string;
			id: string;
			user: User;
		}>();

		// Process each state
		for (const state of allStates) {
			if (!state.activeField?.field) continue;

			// Parse the active field string (format: collection:field:id)
			const [collection, field, id] = state.activeField.field.split(':');
			if (!collection || !field || !id) continue;

			const key = state.activeField.field;

			// Only add if we haven't seen this field before
			if (!activeFieldsMap.has(key)) {
				activeFieldsMap.set(key, {
					key,
					field,
					collection,
					id,
					user: state.user,
				});
			}
		}

		// Convert map to array and return
		return Array.from(activeFieldsMap.values());
	});

	return {
		doc,
		values,
		provider,
		awareness,
		globalAwareness,
		activeUsers,
		globalActiveUsers,
		getUsersBySourceDocument,
		getUsersByActiveField,
		getAllActiveUsers,
		groupedByActiveField,
	};
}
