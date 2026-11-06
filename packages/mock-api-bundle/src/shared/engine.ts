import { errorBody } from './errors';

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type Method = (typeof METHODS)[number];

export function isMethod(value: unknown): value is Method {
	return METHODS.includes(String(value).toUpperCase() as Method);
}

export interface MockResponse {
	name: string;
	status: number;
	body: string;
}

export interface MockEndpoint {
	name: string;
	method: string;
	path: string;
	query: string;
	delay: number;
	response: MockResponse | null;
}

export interface MockCollection {
	name: string;
	prefix: string;
	endpoints: MockEndpoint[];
}

export interface MockRequest {
	method: string;
	path: string;
	query: URLSearchParams;
	body: unknown;
}

export interface Resolved {
	collection: MockCollection;
	endpoint: MockEndpoint;
	status: number;
	body: string;
	delay: number;
}

export function trimSlashes(value: string | null | undefined): string {
	return String(value ?? '')
		.trim()
		.replaceAll(/^\/+|\/+$/g, '');
}

export function segments(path: string): string[] {
	return trimSlashes(path).split('/').filter(Boolean);
}

export function parseRequiredQuery(query: string | null | undefined): [string, string][] {
	return [...new URLSearchParams(String(query ?? '').trim())];
}

interface Candidate {
	collection: MockCollection;
	endpoint: MockEndpoint;
	params: Record<string, string>;
	specificity: number;
	wildcard: boolean;
	order: number;
}

function matchPath(
	pattern: string[],
	request: string[],
): { params: Record<string, string>; specificity: number; wildcard: boolean } | null {
	const params: Record<string, string> = {};
	let specificity = 0;

	for (let i = 0; i < pattern.length; i++) {
		const part = pattern[i]!;

		if (part === '*' && i === pattern.length - 1) {
			if (request.length === i) return null;
			params['*'] = request.slice(i).join('/');
			return { params, specificity, wildcard: true };
		}

		const value = request[i];
		if (value === undefined) return null;

		if (part.startsWith(':')) {
			params[part.slice(1)] = decodeURIComponent(value);
			specificity++;
		}
		else if (part !== value) {
			return null;
		}
	}

	return pattern.length === request.length ? { params, specificity, wildcard: false } : null;
}

function findEndpoint(collections: MockCollection[], request: MockRequest): Candidate | null {
	const requestSegments = segments(request.path);
	const method = request.method.toUpperCase();
	const candidates: Candidate[] = [];

	collections.forEach((collection, collectionIndex) => {
		collection.endpoints.forEach((endpoint, endpointIndex) => {
			if (endpoint.method.toUpperCase() !== method) return;

			const pattern = [...segments(collection.prefix), ...segments(endpoint.path)];
			const match = matchPath(pattern, requestSegments);
			if (!match) return;

			const required = parseRequiredQuery(endpoint.query);
			if (!required.every(([key, value]) => request.query.get(key) === value)) return;

			candidates.push({ collection, endpoint, ...match, order: collectionIndex * 100_000 + endpointIndex });
		});
	});

	candidates.sort(
		(a, b) => Number(a.wildcard) - Number(b.wildcard) || a.specificity - b.specificity || a.order - b.order,
	);

	return candidates[0] ?? null;
}

function lookup(source: unknown, path: string[]): unknown {
	return path.reduce<unknown>(
		(value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]),
		source,
	);
}

export interface TemplateContext {
	params: Record<string, string>;
	query: URLSearchParams;
	body: unknown;
	now?: () => string;
	uuid?: () => string;
}

// Whitespace around the token name is trimmed in code, so the pattern can't backtrack.
const TOKEN = /\{\{([^}]+)\}\}/g;

function tokenValue(token: string, context: TemplateContext): unknown {
	const [scope, ...path] = token.split('.');

	switch (scope) {
		case 'params':
			return context.params[path.join('.')];
		case 'query':
			return context.query.get(path.join('.')) ?? undefined;
		case 'body':
			return lookup(context.body, path);
		default:
			return undefined;
	}
}

export function fillTemplate(template: string, context: TemplateContext): string {
	return template.replaceAll(TOKEN, (_match, raw: string) => {
		const token = raw.trim();
		if (token === 'now') return (context.now ?? (() => new Date().toISOString()))();
		if (token === 'uuid') return (context.uuid ?? (() => globalThis.crypto.randomUUID()))();

		const value = tokenValue(token, context);
		if (value == null) return '';
		return typeof value === 'object' ? JSON.stringify(value) : String(value);
	});
}

// Tokens become 0 so they parse both inside quotes and where a number goes.
export function bodyError(body: string | null | undefined): string | null {
	if (!body?.trim()) return null;

	try {
		JSON.parse(body.replaceAll(TOKEN, '0'));
		return null;
	}
	catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export function resolveRequest(
	collections: MockCollection[],
	request: MockRequest,
	now?: () => string,
): Resolved | null {
	const candidate = findEndpoint(collections, request);
	if (!candidate) return null;

	const response = candidate.endpoint.response ?? { name: 'Empty', status: 204, body: '' };

	return {
		collection: candidate.collection,
		endpoint: candidate.endpoint,
		status: response.status,
		body: fillTemplate(response.body ?? '', {
			params: candidate.params,
			query: request.query,
			body: request.body,
			now,
		}),
		delay: Math.max(0, Number(candidate.endpoint.delay) || 0),
	};
}

export function notFoundBody(method: string, path: string): string {
	return JSON.stringify(
		errorBody(`No mock endpoint matches ${method.toUpperCase()} /${trimSlashes(path)}.`, 'MOCK_NOT_FOUND'),
	);
}
