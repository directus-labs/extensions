import type { IncomingMessage } from 'node:http';
import type { Logger } from 'pino';
import cookie from 'cookie';
// @ts-expect-error - No types available for jsonwebtoken
import jwt from 'jsonwebtoken';

export interface DecodedToken {
	id?: string;
	role?: string;
	admin_access?: boolean;
	app_access?: boolean;
	session?: string;
	iss?: string;
	iat?: number;
	exp?: number;
}

/**
 * Verify authentication token from request headers
 */
export function verifyToken({
	requestHeaders,
	logger,
	env,
	logPrefix = '',
}: {
	requestHeaders: IncomingMessage['headers'];
	logger: Logger;
	env: Record<string, string>;
	logPrefix?: string;
}) {
	try {
		if (!requestHeaders.cookie) {
			logger.warn(`${logPrefix} No cookies found`);
			return null;
		}

		const cookies = cookie.parse(requestHeaders.cookie as string);
		const token = cookies.directus_session_token;

		if (!token) {
			logger.warn(`${logPrefix} No directus_session_token in cookies`);
			return null;
		}

		const decoded = jwt.verify(token, env.SECRET) as DecodedToken;

		logger.info(`${logPrefix} Token verified: ${JSON.stringify(decoded)}`);

		return decoded;
	} catch (error) {
		logger.warn(`${logPrefix} Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
		return null;
	}
}
