import type { Accountability } from '@directus/types';
import type { DecodedToken } from './verify-jwt';

/**
 * Convert a decoded token to an accountability object
 */
export function tokenToAccountability(token: DecodedToken): Accountability {
	return {
		user: token.id ?? null,
		role: token.role ?? null,
		roles: token.role ? [token.role] : [],
		admin: token.admin_access ?? false,
		app: token.app_access ?? false,
		ip: null,
		userAgent: null,
		origin: null,
	};
}
