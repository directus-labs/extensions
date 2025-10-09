import Bottleneck from 'bottleneck';

export interface Schema {

}

export class DirectusError extends Error {
	errors: Array<{ extensions?: Record<string, unknown>; message: string }>;
	headers: Headers;
	message: string;
	response: Response;
	status: number;
	constructor(response: Response) {
		super(response.statusText);
		this.name = 'Directus Migration Error';
		this.headers = response.headers;
		this.status = response.status;
		this.response = response;
		this.errors = [];
		this.message = response.statusText;
	}

	formatError(): string {
		if (this.errors.length === 0) {
			return `Directus Error: ${this.message} (Status: ${this.status})`;
		}

		let formattedError = `Directus Error: ${this.errors[0]?.message.trim()} (Status: ${this.status})`;

		if (this.errors[0]?.extensions) {
			formattedError += ` ${JSON.stringify(this.errors[0].extensions)}`;
		}

		return formattedError;
	}

	async parseErrors(): Promise<void> {
		try {
			const data = await this.response.json();

			if (data && Array.isArray(data.errors)) {
				this.errors = data.errors;
				this.message = this.formatError();
			}
		}
		catch {
			// If parsing fails, keep the errors array empty
		}
	}
}

export async function enhancedFetch(...args: Parameters<typeof fetch>): Promise<Response> {
	// console.log(`${args[1]?.method} ${args[0]}`);
	const response = await fetch(...args);

	if (!response.ok) {
		const error = new DirectusError(response);
		await error.parseErrors();
		throw error;
	}

	return response;
}

export async function initLimiter() {
	const limiter = new Bottleneck({
		maxConcurrent: 2,
		minTime: 100, // Ensure at least 100ms between requests
		reservoir: 50, // Reservoir to handle the default rate limiter of 50 requests per second
		reservoirRefreshAmount: 50,
		reservoirRefreshInterval: 1000, // Refill 50 requests every 1 second
		retryCount: 3, // Retry a maximum of 3 times
	});

	limiter.on('failed', async (error, jobInfo) => {
		console.error(error.message);
		console.error(error.errors[0]?.message);

		if (error instanceof DirectusError) {
			const retryAfter = error.headers?.get('Retry-After');
			const statusCode = error.status;

			if (statusCode === 429) {
				const delay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 60_000;
				console.warn(`Rate limited. Retrying after ${delay}ms`);
				return delay;
			}

			if (statusCode === 503) {
				const delay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : 5000;
				console.warn(`Server under pressure. Retrying after ${delay}ms`);
				return delay;
			}

			// If the status code is 400 or 401, we don't want to retry
			if (statusCode === 400 || statusCode === 401) {
				return;
			}
		}

		// For other errors, use exponential backoff, but only if we haven't exceeded retryCount
		if (jobInfo.retryCount < 3) {
			const delay = Math.min(1000 * 2 ** jobInfo.retryCount, 30_000);
			console.warn(`Request failed. Retrying after ${delay}ms`);
			return delay;
		}

		console.warn('Max retries reached, not retrying further');
	});

	limiter.on('retry', (error, jobInfo) => {
		console.error(error);
		console.warn(`Retrying job (attempt ${jobInfo.retryCount + 1})`);
	});

	limiter.on('depleted', (empty) => {
		if (empty) {
			console.warn('Rate limit quota depleted. Requests will be queued.');
		}
	});

	return limiter;
}
