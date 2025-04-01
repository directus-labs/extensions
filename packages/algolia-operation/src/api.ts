import { createHttpRequester } from '@algolia/requester-node-http';
import { defineOperationApi } from '@directus/extensions-sdk';
import { algoliasearch } from 'algoliasearch';

interface Options {
	appID: string;
	apiKey: string;
	index: string;
	action: string;
	objectID: string;
	params: any;
	body: any;
}

export default defineOperationApi<Options>({
	id: 'algolia-operation',
	handler: async ({ appID, apiKey, index, action, objectID, body, params }) => {
		const client = algoliasearch(appID, apiKey, {
			requester: createHttpRequester(),
		});

		switch (action) {
			case 'add-or-replace':
				return await client.addOrUpdateObject({
					indexName: index,
					objectID,
					body,
				});
			case 'add-or-update-attributes':
				return await client.partialUpdateObject({
					indexName: index,
					objectID,
					attributesToUpdate: body,
				});
			case 'delete':
				return await client.deleteObject({
					indexName: index,
					objectID,
				});
			case 'retrieve':
				return await client.getObject({
					indexName: index,
					objectID,
				});
			case 'search':
				return await client.searchSingleIndex({
					indexName: index,
					searchParams: params,
				});
		}

		throw new Error('No valid Algolia action was specified');
	},
});
