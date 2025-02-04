/// <reference types="@directus/extensions/api.d.ts" />

import type { SandboxOperationConfig } from 'directus:api';
import { log, request } from 'directus:api';

const operation: SandboxOperationConfig = {
	id: 'directus-labs-ai-alt-text-writer-operation',
	handler: async ({ apiKey, url }) => {
		try {
			const response = await request(`https://api.clarifai.com/v2/users/salesforce/apps/blip/models/general-english-image-caption-blip/versions/cdb690f13e62470ea6723642044f95e4/outputs`, {
				method: 'POST',
				headers: {
					'Authorization': `Key ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: {
					inputs: [
						{
							data: {
								image: {
									url,
								},
							},
						},
					],
				},
			});

			const output = (<any>response?.data)?.outputs?.[0]?.data;

			if (output?.text?.raw) {
				return output.text.raw;
			}

			throw new Error('No text was found in the picture.');
		}
		catch (error: any) {
			if (error.response) {
				const response = JSON.parse(error.response);
				const message = response?.data?.status?.description;

				if (message) {
					log(message);
					throw new Error(message);
				}
			}

			log(error.message);
			throw new Error(error.message);
		}
	},
};

export default operation;
