import { randomUUID } from 'node:crypto';

const cache: { ids: ReturnType<typeof createId> | undefined } = {
	ids: undefined,
};

function createId() {
	// user.id => uid
	const ids = new Map<string, string>();

	function getId(userId: string) {
		const existingId = ids.get(userId);
		if (existingId) {
			return existingId;
		}

		const uuid = randomUUID();

		ids.set(userId, uuid);

		return uuid;
	}

	return { getId };
}

export function useId() {
	if (cache.ids) return cache.ids;

	cache.ids = createId();

	return cache.ids;
}
