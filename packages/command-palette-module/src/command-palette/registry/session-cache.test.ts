import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registryRefresh } from './registry';
import { getSessionValue, startCommandSession } from './session-cache';

beforeEach(() => {
	startCommandSession();
});

describe('getSessionValue', () => {
	it('loads once per session and refreshes commands when the value lands', async () => {
		const load = vi.fn().mockResolvedValue(['a']);
		const refresh = registryRefresh.value;

		expect(getSessionValue('key', load)).toBeUndefined();
		expect(getSessionValue('key', load)).toBeUndefined();
		await vi.waitFor(() => expect(getSessionValue('key', load)).toEqual(['a']));

		expect(load).toHaveBeenCalledOnce();
		expect(registryRefresh.value).toBe(refresh + 1);
	});

	it('aborts and drops requests from an earlier session', async () => {
		let resolve: (value: string) => void = () => {};

		let signal: AbortSignal | undefined;

		getSessionValue('key', (requestSignal) => {
			signal = requestSignal;
			return new Promise<string>((done) => {
				resolve = done;
			});
		});

		startCommandSession();
		resolve('stale');
		await Promise.resolve();

		expect(signal?.aborted).toBe(true);
		expect(getSessionValue('key', () => Promise.resolve('fresh'))).toBeUndefined();
		await vi.waitFor(() => expect(getSessionValue('key', vi.fn())).toBe('fresh'));
	});

	it('does not retry a failed request in the same session', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const load = vi.fn().mockRejectedValue(new Error('offline'));

		getSessionValue('key', load);
		await vi.waitFor(() => expect(console.warn).toHaveBeenCalled());

		expect(getSessionValue('key', load)).toBeUndefined();
		expect(load).toHaveBeenCalledOnce();
	});
});
