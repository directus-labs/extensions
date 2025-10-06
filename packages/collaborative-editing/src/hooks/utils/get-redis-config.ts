import { RedisOptions } from 'ioredis';
import { Context } from '../types';

export function getRedisConfig(env: Context['env']): RedisOptions {
	return {
		host: env.REDIS_HOST,
		port: env.REDIS_PORT,
		username: env.REDIS_USERNAME,
		password: env.REDIS_PASSWORD,
	};
}
