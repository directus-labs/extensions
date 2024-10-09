import type { SandboxRequestFn, SandboxLogFn } from 'directus:api';

interface ResendError {
	statusCode: number;
	message: string;
	name: string;
}

export class Resend {
	private baseUrl = 'https://api.resend.com';
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
				const errorData = error.response.data as ResendError;
				this.log(`Resend API Error: ${JSON.stringify(errorData)}`);
				throw new Error(`Resend API Error: ${errorData.message || 'Unknown error'}`);
			} else if (error.request) {
				this.log('No response received from Resend API');
				throw new Error('No response received from Resend API');
			} else {
				this.log(`Error setting up the request: ${error.message}`);
				throw new Error(`Error setting up the request: ${error.message}`);
			}
		}
	}
}
