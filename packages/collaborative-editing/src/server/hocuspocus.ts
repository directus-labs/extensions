import type { DirectusContext } from './types';
import { Server } from '@hocuspocus/server';

// Track all active documents
const activeDocuments = new Map();

export const createHocuspocusServer = (context: DirectusContext) => {
	const { logger, env, getSchema, services } = context;

	const hocuspocus = Server.configure({

		beforeHandleMessage: async (data) => { },

		onAuthenticate: async (data) => { },

		afterLoadDocument: async ({ documentName, document }) => {
			activeDocuments.set(documentName, document);
		},
		onStateless: async ({ payload }) => {
			console.log('onStateChange', payload);
		},

		onAwarenessUpdate: async ({
			// awareness,
			// added,
			// updated,
			// removed,
			documentName,
			states,
		}) => {
			const awarenessPayload = JSON.stringify({
				type: 'global-awareness',
				sourceDocument: documentName,
				states: states
			});

			// Broadcast to all other documents
			for (const [otherDocName, otherDoc] of activeDocuments.entries()) {
				// Don't broadcast back to the source document
				if (otherDocName !== documentName) {
					otherDoc.broadcastStateless(awarenessPayload);
				}
			}
		},

		// Clean up when documents are unloaded
		async afterUnloadDocument({ documentName }) {
			activeDocuments.delete(documentName);
		}



	});

	return hocuspocus;
};
