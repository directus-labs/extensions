import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDeploymentProviders } from './use-deployment-providers';

afterEach(() => vi.useRealTimers());

describe('useDeploymentProviders', () => {
	it('bounds retries, refreshes expired data in place, validates responses, and resets on user changes', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
		const onError = vi.fn();
		const api = {
			get: vi.fn()
				.mockRejectedValueOnce(new Error('offline'))
				.mockResolvedValueOnce({ data: { data: [{ provider: 'github' }] } })
				.mockResolvedValueOnce({ data: { data: [{ provider: 'gitlab' }] } })
				.mockResolvedValueOnce({ data: { data: { invalid: true } } }),
		};
		const firstUser = useDeploymentProviders(api, { userId: 'user-1', onError });

		await expect(firstUser.fetch()).resolves.toBe(false);
		await expect(firstUser.fetch()).resolves.toBe(false);
		expect(api.get).toHaveBeenCalledTimes(1);

		const secondUser = useDeploymentProviders(api, { userId: 'user-2', onError });
		expect(secondUser.providers.value).toEqual([]);
		await expect(secondUser.fetch()).resolves.toBe(true);
		expect(secondUser.providers.value).toEqual([{ provider: 'github' }]);

		vi.advanceTimersByTime(60_000);
		const expired = useDeploymentProviders(api, { userId: 'user-2', onError });
		expect(expired.providers.value).toEqual([{ provider: 'github' }]);
		await expect(expired.fetch()).resolves.toBe(true);
		expect(expired.providers.value).toEqual([{ provider: 'gitlab' }]);

		const malformed = useDeploymentProviders(api, { userId: 'user-3', onError });
		await expect(malformed.fetch()).resolves.toBe(false);
		expect(malformed.loaded.value).toBe(false);
		expect(malformed.providers.value).toEqual([]);
		expect(onError).toHaveBeenCalledTimes(2);
	});

	it('reports a failing endpoint once per user while retries continue', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
		const onError = vi.fn();
		const api = { get: vi.fn().mockRejectedValue(new Error('offline')) };

		await useDeploymentProviders(api, { userId: 'user-4', onError }).fetch();
		vi.advanceTimersByTime(30_000);
		await useDeploymentProviders(api, { userId: 'user-4', onError }).fetch();

		expect(api.get).toHaveBeenCalledTimes(2);
		expect(onError).toHaveBeenCalledOnce();
	});
});
