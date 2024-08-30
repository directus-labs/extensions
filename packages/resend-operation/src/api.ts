/// <reference types="@directus/extensions/api.d.ts" />
import { defineOperationApi } from '@directus/extensions-sdk';
import { Resend } from './resend';
import { emails, domains, apiKeys, audiences, contacts } from './endpoints';
import { log, request } from 'directus:api';

export type Options = {
	apiKey: string;
	endpoint: string;
	action: string;
	[key: string]: any;
};

const endpoints = {
	emails,
	domains,
	apiKeys,
	audiences,
	contacts,
};

export default defineOperationApi<Options>({
	id: 'resend-operation',
	handler: async (options) => {
		const { endpoint, action, apiKey, ...params } = options;
		const client = new Resend(apiKey, request, log);

		const selectedEndpoint = endpoints[endpoint as keyof typeof endpoints];
		if (!selectedEndpoint) {
			throw new Error(`Unsupported endpoint: ${endpoint}`);
		}

		const selectedAction = selectedEndpoint.actions[action as keyof typeof selectedEndpoint.actions];
		if (!selectedAction) {
			throw new Error(`Unsupported action: ${action} for endpoint: ${endpoint}`);
		}

		return (selectedAction as { handler: Function }).handler(client, params);
	},
});
