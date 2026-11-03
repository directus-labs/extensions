import type { Bulk_Request } from '@opensearch-project/opensearch/api/_core/bulk';
import type { OpenSearchObject, OpenSearchOptions } from './types';
import { defineOperationApi } from '@directus/extensions-sdk';
import { Client } from '@opensearch-project/opensearch';
import isValidUrl from './validate-url';

export default defineOperationApi<OpenSearchOptions>({
	id: 'opensearch-operation',
	handler: async ({ host, force_ssl, username, password, action, search_index, document_id, document }) => {
		try {
			if (!['create', 'read', 'update', 'delete'].includes(action)) throw new Error(`Unsupported action: ${action} for OpenSearch`);
			if (!host || !isValidUrl(host)) throw new Error(`Host is invalid. Must be your cloud instance URL or your localhost address. Receieved ${host}`);
			if (!username) throw new Error('Username is empty. Please ensure to provide the username and password.');
			if (!search_index) throw new Error(`Search index is required. Receieved ${search_index}`);
			if (!document_id) throw new Error(`Item ID/Key is required. Receieved ${document_id}`);
			if (['create', 'update'].includes(action) && !document) throw new Error(`Item Data is required for ${action} action.`);

			const client = new Client({
				ssl: {
					rejectUnauthorized: force_ssl,
				},
				node: host,
				auth: {
					username,
					password,
				},
			});

			if (!((await client.indices.exists({ index: search_index })).body)) {
				await client.indices.create({ index: search_index });
			}

			if (Array.isArray(document_id)) {
				const bulkRequest: Bulk_Request = {
					refresh: true,
					index: search_index,
					body: [
						...document_id.map((id) => {
							return {
								[action]: {
									_id: id,
									_index: search_index,
								},
							};
						}),
						...document
							? [{
									doc: document,
								}]
							: [],
					],
				};
				return await client.bulk(bulkRequest);
			}
			else {
				switch (action) {
					case 'create':
						return await client.index({
							index: search_index,
							id: document_id as string,
							body: document as OpenSearchObject,
							refresh: true,
						});
					case 'read':
						return await client.get({
							index: search_index,
							id: document_id as string,
						});
					case 'update':
						return await client.update({
							index: search_index,
							id: document_id as string,
							body: {
								doc: document,
							},
							refresh: true,
						});
					case 'delete':
						return await client.delete({
							index: search_index,
							id: document_id as string,
							refresh: true,
						});
					default:
						throw new Error(`Unsupported action: ${action} for OpenSearch`);
				}
			}
		}
		catch (error) {
			throw new Error((error as Error).message || 'An unknown error occurred');
		}
	},
});
