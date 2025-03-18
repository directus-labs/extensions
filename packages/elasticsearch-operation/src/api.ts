import { ElasticSearchOptions } from './types';
import { defineOperationApi } from '@directus/extensions-sdk';
import { Client } from '@elastic/elasticsearch';
import type { BulkRequest } from '@elastic/elasticsearch/lib/api/types';
import isValidUrl from './validate-url';

export default defineOperationApi<ElasticSearchOptions>({
	id: 'elasticsearch-operation',
	handler: async ({ host, api_key, action, search_index, document_id, document }) => {

		try {

			if(!['create','read','update','delete'].includes(action)) throw new Error(`Unsupported action: ${action} for Elasticsearch`);

			if(!host || !isValidUrl(host)) throw new Error(`Host is invalid. Must be your cloud instance URL or your localhost address. Receieved ${host}`);
			if(!api_key) throw new Error('API Key is empty. Please ensure to create an API key in your cloud instance or include the API from your local instance.');
			if(!search_index) throw new Error(`Search index is required. Receieved ${search_index}`);
			if(!document_id) throw new Error(`Item ID/Key is required. Receieved ${document_id}`);
			if(['create','update'].includes(action) && !document) throw new Error(`Item Data is required for ${action} action.`);
		
			const client = new Client({
				node: host,
				auth: {
					apiKey: api_key,
				},
			});

			if (Array.isArray(document_id)) {
				const bulkRequest: BulkRequest = {
					refresh: true,
					index: search_index,
					operations: [
						...document_id.map((id) => {
							return {
								[action]: {
									_id: id,
									_index: search_index,
								}
							};
						}),
						...document ? [{
							doc: document
						}] : [],
					],
				};
				return await client.bulk(bulkRequest);

			} else {
				switch (action) {
					case 'create':
						return await client.index({
							index: search_index,
							id: document_id as string,
							document: document,
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
							doc: document,
							refresh: true,
						});
					case 'delete':
						return await client.delete({
							index: search_index,
							id: document_id as string,
							refresh: true,
						});
					default:
						throw new Error(`Unsupported action: ${action} for Elasticsearch`);
				}
			}

		} catch(error){
			throw new Error((error as Error).message || 'An unknown error occurred');
		}
	},
});
