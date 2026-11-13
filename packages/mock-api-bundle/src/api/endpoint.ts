import type { Accountability, EndpointConfig } from '@directus/types';
import type { Request, Response } from 'express';
import { notFoundBody, resolveRequest } from '../shared/engine';
import { errorBody } from '../shared/errors';
import { BASE_PATH } from '../shared/tables';
import { isImportStrategy, validateExport } from '../shared/transfer';
import { ensureSchema } from './schema';
import { applyImport, buildExport, loadMocks, previewImport, requiresAuth } from './store';

interface LogEntry {
	time: string;
	method: string;
	path: string;
	status: number;
	answered_by: string | null;
}

const LOG_LIMIT = 50;
const MAX_DELAY = 30_000;
const log: LogEntry[] = [];

function accountabilityOf(req: Request): Accountability | null {
	return (req as Request & { accountability?: Accountability }).accountability ?? null;
}

function isAdmin(req: Request) {
	return accountabilityOf(req)?.admin === true;
}

function sendBody(res: Response, status: number, body: string) {
	if (!body.trim() || status === 204 || status === 304) {
		res.status(status).end();
		return;
	}

	try {
		JSON.parse(body);
		res.status(status).type('application/json').send(body);
	}
	catch {
		res.status(status).type('text/plain').send(body);
	}
}

const SENSITIVE_QUERY = /token|key|secret|password|auth|session|code/i;

export function redactUrl(url: string): string {
	const [path = '', query] = url.split('?');
	if (!query) return path;

	const params = new URLSearchParams(query);

	for (const key of params.keys()) {
		if (SENSITIVE_QUERY.test(key)) params.set(key, 'redacted');
	}

	return `${path}?${params.toString()}`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const endpoint: EndpointConfig = {
	id: BASE_PATH,
	handler: (router, context) => {
		const adminOnly = (req: Request, res: Response) => {
			if (isAdmin(req)) return true;
			res.status(403).json(errorBody('Only admins can manage mocks.', 'FORBIDDEN'));
			return false;
		};

		router.get('/_meta/log', (req, res) => {
			if (!adminOnly(req, res)) return;
			res.json({ data: log });
		});

		router.delete('/_meta/log', (req, res) => {
			if (!adminOnly(req, res)) return;
			log.length = 0;
			res.status(204).end();
		});

		router.get('/_meta/export', async (req, res, next) => {
			if (!adminOnly(req, res)) return;

			try {
				await ensureSchema(context);
				const ids = String(req.query['collections'] ?? '')
					.split(',')
					.map(Number)
					.filter((id) => Number.isInteger(id) && id > 0);

				const file = await buildExport(context.database, ids.length > 0 ? ids : undefined);
				const name = file.collections.map((c) => c.prefix).join('-') || 'empty';
				res.setHeader('Content-Disposition', `attachment; filename="mock-api-${name}.json"`);
				res.json(file);
			}
			catch (error) {
				next(error);
			}
		});

		router.post('/_meta/import', async (req, res, next) => {
			if (!adminOnly(req, res)) return;

			try {
				await ensureSchema(context);
				const strategy = req.body?.strategy ?? 'merge';

				if (!isImportStrategy(strategy)) {
					res
						.status(400)
						.json(errorBody(`Unknown strategy "${strategy}". Use merge, replace or copy.`, 'INVALID_PAYLOAD'));

					return;
				}

				const result = validateExport(req.body?.file);

				if ('error' in result) {
					res.status(400).json(errorBody(result.error, 'INVALID_PAYLOAD'));
					return;
				}

				const plan = req.body?.dry_run
					? await previewImport(context.database, result.file, strategy)
					: await applyImport(context, accountabilityOf(req), result.file, strategy);

				res.json({ data: { ...plan, applied: !req.body?.dry_run } });
			}
			catch (error) {
				next(error);
			}
		});

		router.all('*', async (req, res) => {
			const path = req.path;
			const query = new URLSearchParams(req.originalUrl.split('?')[1] ?? '');
			const entry: LogEntry = {
				time: new Date().toISOString(),
				method: req.method,
				path: redactUrl(req.originalUrl),
				status: 404,
				answered_by: null,
			};

			try {
				await ensureSchema(context);

				if ((await requiresAuth(context.database)) && !accountabilityOf(req)?.user) {
					entry.status = 403;

					res
						.status(403)
						.json(
							errorBody(
								'Sign in to use mock endpoints, or turn off "Require a signed-in user" in Mock API settings.',
								'FORBIDDEN',
							),
						);

					return;
				}

				const resolved = resolveRequest(await loadMocks(context.database), {
					method: req.method,
					path,
					query,
					body: req.body,
				});

				if (!resolved) {
					sendBody(res, 404, notFoundBody(req.method, path));
					return;
				}

				entry.status = resolved.status;
				entry.answered_by = `${resolved.collection.name} / ${resolved.endpoint.name}`;
				if (resolved.delay) await sleep(Math.min(resolved.delay, MAX_DELAY));
				sendBody(res, resolved.status, resolved.body);
			}
			catch (error) {
				context.logger.error(error, '[mock-api] Request failed');
				entry.status = 500;
				res.status(500).json(errorBody('The mock router failed. Check the API logs.', 'INTERNAL_SERVER_ERROR'));
			}
			finally {
				log.unshift(entry);
				log.length = Math.min(log.length, LOG_LIMIT);
			}
		});
	},
};

export default endpoint;
