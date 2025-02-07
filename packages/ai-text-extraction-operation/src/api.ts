/// <reference types="@directus/extensions/api.d.ts" />

import type { SandboxOperationConfig } from 'directus:api';
import { log, request } from 'directus:api';

const operation: SandboxOperationConfig = {
	id: 'directus-labs-ai-text-extraction-operation',
	handler: async ({ apiKey, url }) => {
		try {
			const response = await request(`https://api.clarifai.com/v2/users/clarifai/apps/main/models/ocr-scene-english-paddleocr/versions/46e99516c2d94f58baf2bcaf5a6a53a9/outputs`, {
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

			if (output?.regions) {
				return {
					text: output.regions?.map((region: any) => region.data.text.raw).join('\n'),
					regions: output.regions,
				};
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
