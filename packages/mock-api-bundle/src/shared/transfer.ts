import type { MockResponse } from './engine';
import { bodyError, isMethod, parseRequiredQuery, segments, trimSlashes } from './engine';

export const EXPORT_FORMAT = 'directus-mock-api';
export const EXPORT_VERSION = 1;

export const IMPORT_STRATEGIES = ['merge', 'replace', 'copy'] as const;
export type ImportStrategy = (typeof IMPORT_STRATEGIES)[number];

export function isImportStrategy(value: unknown): value is ImportStrategy {
	return IMPORT_STRATEGIES.includes(value as ImportStrategy);
}

export interface ExportEndpoint {
	name: string;
	method: string;
	path: string;
	query: string;
	delay: number;
	notes: string;
	active_response: string | null;
	responses: MockResponse[];
}

export interface ExportCollection {
	name: string;
	prefix: string;
	enabled: boolean;
	description: string;
	endpoints: ExportEndpoint[];
}

export interface ExportFile {
	format: typeof EXPORT_FORMAT;
	version: number;
	exported_at: string;
	collections: ExportCollection[];
}

export const PREFIX_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function endpointKey(endpoint: { method: string; path: string; query?: string | null }): string {
	const params = new URLSearchParams(parseRequiredQuery(endpoint.query));
	params.sort();
	const query = params.toString();

	return `${endpoint.method.toUpperCase()} /${segments(endpoint.path).join('/')}${query ? `?${query}` : ''}`;
}

export function validateExport(input: unknown): { file: ExportFile } | { error: string } {
	let data = input;

	if (typeof data === 'string') {
		try {
			data = JSON.parse(data);
		}
		catch {
			return { error: 'The file is not valid JSON.' };
		}
	}

	const file = data as Partial<ExportFile> | null;

	if (!file || typeof file !== 'object' || file.format !== EXPORT_FORMAT || !Array.isArray(file.collections)) {
		return { error: `This is not a Mock API export. Expected "format": "${EXPORT_FORMAT}".` };
	}

	if (typeof file.version !== 'number' || file.version > EXPORT_VERSION) {
		return { error: `This file uses export version ${file.version}. Update the Mock API extension to import it.` };
	}

	if (!Number.isInteger(file.version) || file.version < 1) {
		return { error: `This file uses export version ${file.version}, which doesn't exist.` };
	}

	const prefixes = new Set<string>();

	for (const collection of file.collections) {
		const error = collectionError(collection, prefixes);
		if (error) return { error };
	}

	return { file: file as ExportFile };
}

function collectionError(collection: ExportCollection | null, prefixes: Set<string>): string | null {
	const name = collection?.name ?? 'unnamed';
	const prefix = trimSlashes(collection?.prefix);

	if (!collection?.name || !PREFIX_PATTERN.test(prefix)) {
		return `Collection "${name}" needs a prefix of lowercase letters, numbers and dashes.`;
	}

	if (prefixes.has(prefix)) return `Two collections in this file use the prefix "${prefix}".`;
	prefixes.add(prefix);

	const endpoints: unknown = collection.endpoints ?? [];
	if (!Array.isArray(endpoints)) return `The endpoints of "${name}" must be a list.`;

	const keys = new Set<string>();

	for (const endpoint of endpoints as (ExportEndpoint | null)[]) {
		if (!isMethod(endpoint?.method)) {
			return `Endpoint "${endpoint?.name ?? 'unnamed'}" in "${name}" has an unsupported method.`;
		}

		if (!endpoint.name || typeof endpoint.path !== 'string' || !endpoint.path.trim()) {
			return `An endpoint in "${name}" is missing its name or path.`;
		}

		if (endpoint.responses != null && !Array.isArray(endpoint.responses)) {
			return `The responses of "${endpoint.name}" in "${name}" must be a list.`;
		}

		for (const response of endpoint.responses ?? []) {
			const error = bodyError(response?.body);
			if (error) return `Response "${response.name}" of "${endpoint.name}" in "${name}" isn't valid JSON: ${error}`;
		}

		const key = endpointKey(endpoint);
		if (keys.has(key)) return `"${name}" has two endpoints for ${key}.`;
		keys.add(key);
	}

	return null;
}

export interface LocalCollectionSummary {
	prefix: string;
	endpointKeys: string[];
}

export interface ImportPlan {
	strategy: ImportStrategy;
	newCollections: number;
	replacedCollections: number;
	copiedCollections: number;
	endpointsAdded: number;
	endpointsUpdated: number;
	endpointsKept: number;
	collections: { prefix: string; action: 'create' | 'replace' | 'copy' | 'merge'; targetPrefix: string }[];
}

function nextFreePrefix(prefix: string, taken: Set<string>): string {
	let n = 2;
	while (taken.has(`${prefix}-${n}`)) n++;
	return `${prefix}-${n}`;
}

export function planImport(local: LocalCollectionSummary[], file: ExportFile, strategy: ImportStrategy): ImportPlan {
	const plan: ImportPlan = {
		strategy,
		newCollections: 0,
		replacedCollections: 0,
		copiedCollections: 0,
		endpointsAdded: 0,
		endpointsUpdated: 0,
		endpointsKept: 0,
		collections: [],
	};

	const taken = new Set([...local, ...file.collections].map((c) => trimSlashes(c.prefix)));

	for (const incoming of file.collections) {
		const prefix = trimSlashes(incoming.prefix);
		const endpoints = incoming.endpoints ?? [];
		const existing = local.find((c) => trimSlashes(c.prefix) === prefix);

		if (!existing) {
			plan.newCollections++;
			plan.endpointsAdded += endpoints.length;
			plan.collections.push({ prefix, action: 'create', targetPrefix: prefix });
			taken.add(prefix);
			continue;
		}

		if (strategy === 'replace') {
			plan.replacedCollections++;
			plan.endpointsAdded += endpoints.length;
			plan.collections.push({ prefix, action: 'replace', targetPrefix: prefix });
			continue;
		}

		if (strategy === 'copy') {
			const targetPrefix = nextFreePrefix(prefix, taken);
			taken.add(targetPrefix);
			plan.copiedCollections++;
			plan.endpointsAdded += endpoints.length;
			plan.collections.push({ prefix, action: 'copy', targetPrefix });
			continue;
		}

		const localKeys = new Set(existing.endpointKeys);
		const theirKeys = new Set(endpoints.map(endpointKey));

		for (const key of theirKeys) {
			if (localKeys.has(key)) plan.endpointsUpdated++;
			else plan.endpointsAdded++;
		}

		plan.endpointsKept += [...localKeys].filter((key) => !theirKeys.has(key)).length;
		plan.collections.push({ prefix, action: 'merge', targetPrefix: prefix });
	}

	return plan;
}

export function describePlan(plan: ImportPlan): string {
	const parts: string[] = [];
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	if (plan.newCollections) parts.push(`${plural(plan.newCollections, 'new collection')}`);
	if (plan.replacedCollections) parts.push(`${plural(plan.replacedCollections, 'collection')} replaced`);
	if (plan.copiedCollections) parts.push(`${plural(plan.copiedCollections, 'collection')} copied with a new prefix`);
	parts.push(`${plural(plan.endpointsAdded, 'endpoint')} added`);
	if (plan.strategy === 'merge') parts.push(`${plan.endpointsUpdated} updated`, `${plan.endpointsKept} of yours kept`);

	return `${parts.join(', ')}.`;
}
