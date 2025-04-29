import type { ComputedRef } from 'vue';
import { HocuspocusProvider } from '@hocuspocus/provider';
// src/stores/useHocuspocusStore.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as Y from 'yjs';

// Types
export interface User {
	id: string;
	color: string;
	first_name: string;
	last_name: string;
	avatar?: {
		id: string;
	};
}

export interface AwarenessState {
	user: User;
	activeField?: {
		field: string;
	};
}

type AwarenessType = 'local-awareness' | 'global-awareness';

export interface Awareness {
	type: AwarenessType;
	sourceDocument: string;
	states: AwarenessState[];
}

export interface ActiveFieldItem {
	key: string;
	field: string;
	collection: string;
	id: string;
	user: User;
}

export interface HocuspocusProviderOptions {
	url: string;
	name: string;
	onAwarenessUpdate?: () => void;
}

export const useCollaborationStore = defineStore('collaboration', () => {
	// State
	const doc = ref<Y.Doc | null>(null);
	const values = ref<Y.Map<any> | null>(null);
	const provider = ref<HocuspocusProvider | null>(null);
	const documentAwarenessStates = ref<AwarenessState[]>([]);
	const globalAwarenessRef = ref<Awareness | null>(null);
	const documentAwarenessRef = ref<Awareness | null>(null);
	const currentUserRef = ref<User | null>(null);

	// Computed current user
	const currentUser = computed(() => currentUserRef.value);

	// Initialize provider
	function initializeProvider(options: HocuspocusProviderOptions & { currentUser?: User | null }): void {
		// Set the current user if provided
		if (options.currentUser) {
			currentUserRef.value = options.currentUser;
		}

		// Initialize a new YJS doc
		const newDoc = new Y.Doc();
		doc.value = newDoc;
		values.value = newDoc.getMap('values');

		// Initialize HocuspocusProvider
		const newProvider = new HocuspocusProvider({
			url: options.url,
			name: options.name,
			document: newDoc,
			token: '123', // @TODO: Need to pass a token here
			onStatus: ({ status }) => {
				console.warn('Collaboration status:', status);
			},
			onAwarenessChange: () => {
				if (!newProvider.awareness) return;

				const states = Array.from(newProvider.awareness.getStates().values()) as AwarenessState[];
				documentAwarenessStates.value = states;

				const newStates = states.map((state: AwarenessState) => {
					const existingState = documentAwarenessRef.value?.states.find((s) => s.user.id === state.user.id);
					return existingState ? { ...existingState, ...state } : state;
				});

				const newAwarenessState: Awareness = {
					type: 'local-awareness',
					sourceDocument: options.name,
					states: newStates,
				};

				documentAwarenessRef.value = newAwarenessState;

				console.warn('Document awareness states:', documentAwarenessRef.value);

				// Call the update callback if provided
				if (options.onAwarenessUpdate) {
					options.onAwarenessUpdate();
				}
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

		provider.value = newProvider;

		// Set initial awareness state
		if (newProvider.awareness && currentUser.value) {
			newProvider.setAwarenessField('user', {
				id: currentUser.value.id,
				first_name: currentUser.value.first_name,
				last_name: currentUser.value.last_name,
				avatar: currentUser.value.avatar,
				color: currentUser.value.color,
			});
		}
	}

	// Destroy provider
	function destroyProvider(): void {
		if (provider.value) {
			provider.value.destroy();
			provider.value = null;
			doc.value = null;
			values.value = null;
		}
	}

	// Document Awareness Getters
	const documentAwareness = {
		local: computed(() => {
			const state = provider.value?.awareness?.getLocalState() as AwarenessState | null;
			return {
				user: state?.user || currentUser.value!,
				activeField: state?.activeField,
			};
		}),
		others: computed(() => {
			return documentAwarenessStates.value.filter((state) =>
				state.user?.id !== currentUser.value?.id,
			);
		}),
		all: computed(() => {
			return documentAwarenessStates.value;
		}),
		setLocalField: <T>(field: string, value: T) => {
			if (!provider.value?.awareness) return;
			provider.value.awareness.setLocalStateField(field, value);
		},
		setActiveField: (field: string | null) => {
			if (!provider.value?.awareness) return;
			provider.value.awareness.setLocalStateField('activeField', field ? { field } : null);
		},
	} as const;

	// Global Awareness Getters
	const globalAwareness: {
		all: ComputedRef<AwarenessState[]>;
		others: ComputedRef<AwarenessState[]>;
	} = {
		all: computed(() => {
			const globalStates = globalAwarenessRef.value?.states || [];
			return globalStates;
		}),
		others: computed(() => {
			return globalAwareness.all.value.filter((state: AwarenessState) =>
				state.user.id !== currentUser.value?.id,
			);
		}),
	};

	// Active Users
	const activeUsers = computed(() => {
		const awarenessArray = [];
		if (globalAwarenessRef.value) awarenessArray.push(globalAwarenessRef.value);
		if (documentAwarenessRef.value) awarenessArray.push(documentAwarenessRef.value);

		return getAllActiveUsers(awarenessArray);
	});

	const documentActiveUsers = computed(() => {
		return documentAwareness.all.value.map((state) => state.user);
	});

	const globalActiveUsers = computed(() => {
		return globalAwarenessRef.value?.states.map((state) => state.user) || [];
	});

	// Grouped active fields
	const groupedByActiveField = computed(() => {
		// Combine local and global awareness states
		const documentStates = documentAwareness.all.value;
		const globalStates = globalAwareness.all.value;
		const allStates = [...documentStates, ...globalStates];

		// Create a map to store unique active fields by their key
		const activeFieldsMap = new Map<string, ActiveFieldItem>();

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
		const activeFields = Array.from(activeFieldsMap.values());
		return activeFields;
	});

	// Utility functions
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

	function getUsersByActiveField(
		awarenessArray: Awareness[],
		fieldValue: string,
	): User[] {
		const users: Map<string, User> = new Map();

		awarenessArray.forEach((item) => {
			item.states.forEach((state) => {
				if (state.activeField && state.activeField.field === fieldValue
					&& !users.has(state.user.id)) {
					users.set(state.user.id, state.user);
				}
			});
		});

		return Array.from(users.values());
	}

	return {
		// State
		doc,
		values,
		provider,

		// Initialization
		initializeProvider,
		destroyProvider,

		// Awareness state and methods
		documentAwareness,
		globalAwareness,

		// Users
		activeUsers,
		globalActiveUsers,

		// Grouped fields
		groupedByActiveField,

		// Utility functions
		getUsersBySourceDocument,
		getUsersByActiveField,
		getAllActiveUsers,
		documentActiveUsers,
	};
});
