/// <reference types="@directus/extensions/api.d.ts" />
import { InvalidPayloadError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions-sdk';
import { log, request } from 'directus:api';

interface GithubOperationOptions {
	owner: string;
	repo: string;
	accessToken: string;
	eventType: string;
	clientPayload: JSON;
};

interface RequestBody {
	event_type: string;
	client_payload?: JSON;
};

export default defineOperationApi<GithubOperationOptions>({
	id: 'directus-labs-github-operation',
	handler: async (options) => {
		const requiredFields: (keyof GithubOperationOptions)[] = ['owner', 'repo', 'accessToken', 'eventType'];

		for (const field of requiredFields) {
			if (!options[field]) {
				throw new InvalidPayloadError({ reason: `Missing required field: ${field}` });
			}
		}

		const requestBody: RequestBody = {
			event_type: options.eventType,
		};

		if (options.clientPayload) {
			requestBody.client_payload = options.clientPayload;
		}

		try {
			const _response = await request(`https://api.github.com/repos/${options.owner}/${options.repo}/dispatches`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${options.accessToken}`,
					'Accept': 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
				},
				body: JSON.stringify(requestBody),
			});

			return { status: 204 };
		}
		catch (error: any) {
			const response = JSON.parse(error.response);
			const errorString = JSON.stringify(response.data) || 'Github Request failed, please check your configuration';
			log(errorString);

			throw new Error(errorString);
		}
	},
});
