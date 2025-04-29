import type { Awareness } from './collaboration';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCollaborationStore } from './collaboration';

const mockUser = {
	id: 'user-1',
	color: '#FF0000',
	first_name: 'Test',
	last_name: 'User',
	avatar: { id: 'avatar-1' },
};

describe('Collaboration Store', () => {
	beforeEach(() => {
		// Create a fresh Pinia instance for each test
		setActivePinia(createPinia());

		// Reset mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('State initialization', () => {
		it('should initialize with default values', () => {
			const store = useCollaborationStore();

			expect(store.doc).toBeNull();
			// expect(store.values).toBeNull();
			// expect(store.provider).toBeNull();
			// expect(store.globalAwareness).toBeNull();
			// expect(store.documentAwareness).toBeNull();
		});
	});

	describe('initializeProvider', () => {
		it('should initialize provider with correct options', () => {
			const store = useCollaborationStore();

			store.initializeProvider({
				url: 'ws://test-url',
				name: 'test-document',
				currentUser: mockUser,
			});

			// Verify provider was initialized
			expect(store.provider).not.toBeNull();

			// Verify user was set
			expect(store.documentAwareness?.local.user).toEqual(mockUser);
		});
	});

	describe('documentAwareness', () => {
		it('should return local awareness state', () => {
			const store = useCollaborationStore();

			store.initializeProvider({
				url: 'ws://test-url',
				name: 'test-document',
				currentUser: mockUser,
			});

			// Check local awareness
			const localAwareness = store.documentAwareness?.local;

			expect(localAwareness).toEqual({
				user: mockUser,
				activeField: undefined,
			});
		});
	});

	describe('User-related utilities', () => {
		it('should get users by source document', () => {
			const store = useCollaborationStore();

			const testAwareness: Awareness[] = [
				{
					type: 'local-awareness',
					sourceDocument: 'doc1',
					states: [
						{ user: { id: 'user1', first_name: 'User', last_name: 'One', color: '#FF0000' } },
						{ user: { id: 'user2', first_name: 'User', last_name: 'Two', color: '#00FF00' } },
					],
				},
				{
					type: 'local-awareness',
					sourceDocument: 'doc2',
					states: [
						{ user: { id: 'user3', first_name: 'User', last_name: 'Three', color: '#0000FF' } },
					],
				},
			];

			const result = store.getUsersBySourceDocument(testAwareness, 'doc1');

			expect(result).toHaveLength(2);
			expect(result?.[0]?.id).toBe('user1');
			expect(result?.[1]?.id).toBe('user2');
		});

		it('should get all active users from all awareness states', () => {
			const store = useCollaborationStore();

			const testAwareness: Awareness[] = [
				{
					type: 'local-awareness',
					sourceDocument: 'doc1',
					states: [
						{ user: { id: 'user1', first_name: 'User', last_name: 'One', color: '#FF0000' } },
						{ user: { id: 'user2', first_name: 'User', last_name: 'Two', color: '#00FF00' } },
					],
				},
				{
					type: 'local-awareness',
					sourceDocument: 'doc2',
					states: [
						{ user: { id: 'user3', first_name: 'User', last_name: 'Three', color: '#0000FF' } },
					],
				},
			];

			const result = store.getAllActiveUsers(testAwareness);

			expect(result).toHaveLength(3);
			expect(result.map((user) => user.id)).toContain('user1');
			expect(result.map((user) => user.id)).toContain('user2');
			expect(result.map((user) => user.id)).toContain('user3');
		});

		it('should get users by active field', () => {
			const store = useCollaborationStore();

			const testAwareness: Awareness[] = [
				{
					type: 'local-awareness',
					sourceDocument: 'doc1',
					states: [
						{
							user: { id: 'user1', first_name: 'User', last_name: 'One', color: '#FF0000' },
							activeField: { field: 'field1' },
						},
						{
							user: { id: 'user2', first_name: 'User', last_name: 'Two', color: '#00FF00' },
							activeField: { field: 'field2' },
						},
					],
				},
				{
					type: 'local-awareness',
					sourceDocument: 'doc2',
					states: [
						{
							user: { id: 'user3', first_name: 'User', last_name: 'Three', color: '#0000FF' },
							activeField: { field: 'field1' },
						},
					],
				},
			];

			const result = store.getUsersByActiveField(testAwareness, 'field1');

			expect(result).toHaveLength(2);
			expect(result?.[0]?.id).toBe('user1');
			expect(result?.[1]?.id).toBe('user3');
		});
	});
});
