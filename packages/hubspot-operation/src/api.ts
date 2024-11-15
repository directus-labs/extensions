/// <reference types="@directus/extensions/api.d.ts" />
import { defineOperationApi } from '@directus/extensions-sdk';
import { HubSpot } from './hubspot';
import { activities, calls, communications, companies, contacts, deals, email, leads, meetings, notes, products, tasks, tickets } from './endpoints';
import { log, request } from 'directus:api';
import type { HubSpotOptions } from './types';

const hubspotEndpoints = {
	activities,
	calls,
	communications,
	companies,
	contacts,
	deals,
	email,
	leads,
	meetings,
	notes,
	products,
	tasks,
	tickets,
};

export default defineOperationApi<HubSpotOptions>({
	id: 'hubspot-operation',
	handler: async (options) => {
		const { endpoint, action, apiKey, ...params } = options;
		const client = new HubSpot(apiKey, request, log);

		const selectedEndpoint = hubspotEndpoints[endpoint as keyof typeof hubspotEndpoints];
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
