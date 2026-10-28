import type { useStores } from '@directus/extensions-sdk';

export function isServerVersionAtLeast(stores: ReturnType<typeof useStores>, minimum: string) {
	const version: unknown = stores.useServerStore?.().info?.version;
	if (typeof version !== 'string') return false;

	const current = version.split(/[.-]/).slice(0, 3).map(Number);
	const target = minimum.split('.').map(Number);

	for (let index = 0; index < 3; index++) {
		const difference = (current[index] ?? 0) - (target[index] ?? 0);
		if (difference !== 0) return difference > 0;
	}

	return true;
}
