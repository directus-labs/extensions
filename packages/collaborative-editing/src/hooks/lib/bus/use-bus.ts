import { createBus, type Bus } from '@directus/memory';
import { Redis } from 'ioredis';
import { Context } from '../../types';
import { getRedisConfig } from '../../utils/get-redis-config';
import { redisConfigAvailable } from '../../utils/redis-config-available';

const cache: { bus: Bus | undefined } = {
	bus: undefined,
};

export const useBus = (env: Context['env']) => {
	if (cache.bus) {
		return cache.bus;
	}

	if (redisConfigAvailable(env)) {
		cache.bus = createBus({
			type: 'redis',
			redis: new Redis(env['REDIS'] ?? getRedisConfig(env)),
			namespace: 'realtime:bus',
		});
	} else {
		cache.bus = createBus({ type: 'local' });
	}

	return cache.bus;
};
