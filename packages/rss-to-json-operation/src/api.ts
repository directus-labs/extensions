import { defineOperationApi } from '@directus/extensions-sdk';
import { request } from 'directus:api';
import { XMLParser } from 'fast-xml-parser';

type Options = {
	url: string;
};

export default defineOperationApi<Options>({
	id: 'directus-labs-rss-to-json',
	handler: async ({ url }: { url: string }) => {
		const response = await request(url);
		if(response.status != 200) throw new Error('An error occurred when accessing feed.')
		const parser = new XMLParser();
		return parser.parse(response.data)
	},
});
