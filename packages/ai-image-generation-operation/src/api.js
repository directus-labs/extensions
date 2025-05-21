import { log, request } from 'directus:api';

export default {
	id: 'directus-labs-ai-image-generation',
	handler: async ({ apiKey, prompt, quality, size, model = 'gpt-image-1', token, publicUrl }) => {
		try {
			const { size: dimensions } = [
				{ label: 'square', size: '1024x1024' },
				{ label: 'portrait', size: '1024x1792' },
				{ label: 'landscape', size: '1792x1024' },
			].find((d) => d.label === size) ?? { size: '1024x1024' };

			const genResponse = await request('https://api.openai.com/v1/images/generations', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model,
					n: 1,
					prompt,
					quality,
					size: dimensions,
					response_format: model === 'gpt-image-1' ? 'b64_json' : 'url',
				}),
			});

			if (genResponse.status !== 200) {
				throw new Error(`Image generation failed: ${genResponse.status}`);
			}

			const data = genResponse.data.data[0];
			let fileId;
			const cleanPublicUrl = publicUrl.replace(/\/$/, '');

			if (model === 'dall-e-3') {
				// DALL·E 3 gives back a URL we can pass to Directus file import
				const importResponse = await request(`${cleanPublicUrl}/files/import`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ url: data.url }),
				});

				fileId = importResponse.data?.data?.id;
			}
			else {
				// GPT-Image-1 gives back a base64 image data URL
				// eslint-disable-next-line n/prefer-global/buffer
				const buffer = globalThis.Buffer.from(data.b64_json, 'base64');

				const uploadResponse = await request(`${cleanPublicUrl}/files`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/octet-stream',
						'Content-Disposition': 'attachment; filename="ai-image.png"',
					},
					body: buffer,
				});

				fileId = uploadResponse.data?.data?.id;
			}

			if (!fileId) throw new Error('Failed to upload image');
			return fileId;
		}
		catch (error) {
			log(error.message);
			throw new Error(error.message);
		}
	},
};
