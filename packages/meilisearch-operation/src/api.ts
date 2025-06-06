import type { MeiliSearchOptions } from './types';
import { defineOperationApi } from '@directus/extensions-sdk';
import { MeiliSearch } from 'meilisearch';
import isValidUrl from './validate-url';

export default defineOperationApi<MeiliSearchOptions>({
	id: 'meilisearch-operation',
	handler: async ({ host, api_key, action, search_index, document_id, document }) => {
		try {
			if (!['create', 'read', 'update', 'delete'].includes(action)) throw new Error(`Unsupported action: ${action} for Meilisearch`);
			if (!host || !isValidUrl(host)) throw new Error(`Host is invalid. Must be your cloud instance URL or your localhost address. Receieved ${host}`);
			if (!api_key) throw new Error('API Key is empty. Please ensure to provide an API Key.');
			if (!search_index) throw new Error(`Search index is required. Receieved ${search_index}`);
			if (action !== 'read' && (!document_id || (Array.isArray(document_id) && document_id.length === 0))) throw new Error(`Item ID/Key is required. Receieved ${document_id}`);
			if (['create', 'update'].includes(action) && !document) throw new Error(`Item Data is required for ${action} action.`);

			const client = new MeiliSearch({
				host,
				apiKey: api_key,
			});

			const index = client.index(search_index);

			if (Array.isArray(document_id)) {
				if (action === 'delete') {
					return await index.deleteDocuments(document_id);
				}
				else {
					const documents = document_id.map((id) => {
						return {
							id,
							...document,
						};
					});
					return await index.updateDocuments(documents);
				}
			}
			else {
				switch (action) {
					case 'create':
						return await index.addDocuments([{
							id: document_id,
							...document,
						}]);
					case 'read':
						return document_id ? await index.getDocument(document_id) : await index.getDocuments(document);
					case 'update':
						return await index.updateDocuments([{
							id: document_id,
							...document,
						}]);
					case 'delete':
						return await index.deleteDocument(document_id);
					default:
						throw new Error(`Unsupported action: ${action} for Meilisearch`);
				}
			}
		}
		catch (error) {
			throw new Error((error as Error).message || 'An unknown error occurred');
		}
	},
});
