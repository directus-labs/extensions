import type { SandboxRequestFn, SandboxLogFn } from 'directus:api';

interface HubSpotError {
	status: string;
	message: any;
	correlationId: string;
	errors: Array<Record<string, any>>;
	links: Record<string, any>;
	category: string;
}

export class HubSpot {
	private baseUrl = 'https://api.hubapi.com';
	private readonly headers: Record<string, string>;

	constructor(
		private apiKey: string,
		private readonly request: SandboxRequestFn,
		private log: SandboxLogFn,
	) {
		if (!this.apiKey) {
			throw new Error('API Key is required');
		}
		this.headers = {
			Authorization: `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json',
		};
	}

	async fetchRequest<T>(path: string, method: string, body: Record<string, any> = {}): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		try {
			const response = await this.request(url, {
				method: method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
				headers: this.headers,
				body: method !== 'GET' ? body : undefined,
			});

			return response.data as T;
		} catch (error: any) {
			if (error.response) {
				const responseData = typeof error.response === 'string' ? JSON.parse(error.response) : error.response;
				const errorData = responseData.data as HubSpotError;
				this.log(`HubSpot API Error: ${JSON.stringify(errorData)}`);
				throw new Error(`HubSpot API Error: ${errorData.message || 'Unknown error'}`);
			} else if (error.request) {
				this.log('No response received from HubSpot API');
				throw new Error('No response received from HubSpot API');
			} else {
				this.log(`Error setting up the request: ${JSON.stringify(error)}`);
				throw new Error(`Error setting up the request: ${JSON.stringify(error)}`);
			}
		}
	}
}
