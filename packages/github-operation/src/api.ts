import { defineOperationApi } from '@directus/extensions-sdk';

type Options = {
	text: string;
};

export default defineOperationApi<Options>({
	id: 'directus-labs-github-operation',
	handler: ({ text }) => {
		console.log(text);
	},
});
