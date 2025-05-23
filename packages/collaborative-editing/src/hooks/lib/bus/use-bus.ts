import { createBus, type Bus } from '@directus/memory';
import { Redis } from 'ioredis';
import { Context } from '../../types';
import { getRedisConfig } from '../../utils/get-redis-config';
import { redisConfigAvailable } from '../../utils/redis-config-available';

export const _cache: { bus: Bus | undefined } = {
	bus: undefined,
};

export const useBus = (env: Context['env']) => {
	if (_cache.bus) {
		return _cache.bus;
	}

	if (redisConfigAvailable(env)) {
		_cache.bus = createBus({
			type: 'redis',
			redis: new Redis(env['REDIS'] ?? getRedisConfig(env)),
			namespace: 'realtime:bus',
		});
	} else {
		_cache.bus = createBus({ type: 'local' });
	}

	return _cache.bus;
};
