import { Context } from '../types';

export function redisConfigAvailable(env: Context['env']) {
	return 'REDIS' in env || env.REDIS_ENABLED === true;
}
