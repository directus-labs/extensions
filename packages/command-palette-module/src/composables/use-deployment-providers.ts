import type { PrimaryKey } from '@directus/types';
import { ref } from 'vue';
import { z } from 'zod';

interface ApiClient {
	get: (url: string, config?: Record<string, any>) => Promise<{ data: { data?: unknown } }>;
}

interface DeploymentProviderOptions {
	userId: PrimaryKey | null | undefined;
	onError: (error: unknown) => void;
}

const DeploymentProvider = z.object({
	provider: z.string(),
	projects: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
});
const DeploymentProviders = z.array(DeploymentProvider);
const RETRY_DELAY = 30_000;
const CACHE_TTL = 60_000;

export type DeploymentProvider = z.infer<typeof DeploymentProvider>;

// Registry callbacks rerun for each palette query, so this user-scoped cache avoids repeated provider requests.
const providers = ref<DeploymentProvider[]>([]);
const loading = ref(false);
const loaded = ref(false);
let fetchPromise: Promise<boolean> | null = null;
let requestId = 0;
let currentUserId: string | undefined;
let failedAt: number | undefined;
let loadedAt: number | undefined;

export function useDeploymentProviders(api: ApiClient, options: DeploymentProviderOptions) {
	const userId = options.userId === null || options.userId === undefined ? undefined : String(options.userId);
	const userChanged = currentUserId !== userId;
	const cacheExpired = loadedAt !== undefined && Date.now() - loadedAt >= CACHE_TTL;

	if (userChanged || cacheExpired) reset(userId);

	async function fetch() {
		if (loaded.value) return true;
		if (fetchPromise) return fetchPromise;
		if (failedAt !== undefined && Date.now() - failedAt < RETRY_DELAY) return false;

		loading.value = true;
		const currentRequest = ++requestId;
		fetchPromise = fetchProviders(api, currentRequest, options.onError);
		return fetchPromise;
	}

	return { providers, loading, loaded, fetch };
}

async function fetchProviders(
	api: ApiClient,
	currentRequest: number,
	onError: (error: unknown) => void,
) {
	try {
		const response = await api.get('/deployments', {
			params: { fields: ['provider', 'projects.id', 'projects.name'] },
		});
		const data = DeploymentProviders.parse(response.data.data ?? []);

		if (currentRequest !== requestId) return false;
		providers.value = data;
		loaded.value = true;
		loadedAt = Date.now();
		failedAt = undefined;
		return true;
	}
	catch (error) {
		if (currentRequest === requestId) {
			failedAt = Date.now();
			onError(error);
		}

		return false;
	}
	finally {
		if (currentRequest === requestId) {
			fetchPromise = null;
			loading.value = false;
		}
	}
}

function reset(userId: string | undefined) {
	requestId++;
	currentUserId = userId;
	providers.value = [];
	loading.value = false;
	loaded.value = false;
	fetchPromise = null;
	failedAt = undefined;
	loadedAt = undefined;
}
