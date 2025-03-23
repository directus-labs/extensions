import { defineOperationApi } from '@directus/extensions-sdk';
import { algoliasearch } from "algoliasearch";
import { createHttpRequester } from "@algolia/requester-node-http";

type Options = {
	appID: string;
	apiKey: string;
	index: string;
	action: string;
	objectID: string;
	params: any;
	body: any;
};

export default defineOperationApi<Options>({
	id: 'algolia-operation',
	handler: async ({ appID, apiKey, index, action, objectID, body, params }) => {
		const client = algoliasearch(appID, apiKey, {
			requester: createHttpRequester()
		});

		if (action == 'add-or-replace') {
			return await client.addOrUpdateObject({
				indexName: index,
				objectID: objectID,
				body: body
			});
		} else if (action == 'add-or-update-attributes') {
			return await client.partialUpdateObject({
				indexName: index,
				objectID: objectID,
				attributesToUpdate: body,
			});
		} else if (action == 'delete') {
			return await client.deleteObject({ 
				indexName: index,
				objectID: objectID
			});
		} else if (action == 'retrieve') {
			return await client.getObject({
				indexName: index,
				objectID: objectID
			});
		} else if (action == 'search') {
			return await client.searchSingleIndex({ 
				indexName: index,
				searchParams: params
			});
		}

		throw Error("No valid Algolia action was specified");
	},
});
