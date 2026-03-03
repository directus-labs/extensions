import type { SchemaDiffOutput } from '@directus/sdk';

/**
 * Filters a schema diff to exclude directus_* system collections
 * and optionally limit to specific collections.
 */
export function filterSchemaDiff(
	diff: SchemaDiffOutput,
	includedCollections?: Set<string>
): SchemaDiffOutput {
	// If no diff or no hash (meaning no changes), return as-is
	if (!diff || !('hash' in diff) || !('diff' in diff)) {
		return diff;
	}

	const shouldInclude = (collectionName: string): boolean => {
		// Always exclude directus_* system collections
		if (collectionName.startsWith('directus_')) {
			return false;
		}
		// If we have a specific set of collections to include, check against it
		if (includedCollections && includedCollections.size > 0) {
			return includedCollections.has(collectionName);
		}
		// Otherwise include all non-system collections
		return true;
	};

	const filteredDiff = { ...diff.diff };

	// Filter collections
	if (filteredDiff.collections && Array.isArray(filteredDiff.collections)) {
		filteredDiff.collections = filteredDiff.collections.filter((c: any) =>
			shouldInclude(c.collection)
		);
	}

	// Filter fields
	if (filteredDiff.fields && Array.isArray(filteredDiff.fields)) {
		filteredDiff.fields = filteredDiff.fields.filter((f: any) =>
			shouldInclude(f.collection)
		);
	}

	// Filter relations
	if (filteredDiff.relations && Array.isArray(filteredDiff.relations)) {
		filteredDiff.relations = filteredDiff.relations.filter((r: any) =>
			shouldInclude(r.collection) &&
			(r.related_collection === null || shouldInclude(r.related_collection))
		);
	}

	return {
		...diff,
		diff: filteredDiff,
	};
}

/**
 * Extracts the set of collection names from a schema snapshot
 */
export function getCollectionsFromSchema(schema: any): Set<string> {
	const collections = new Set<string>();
	if (schema?.collections && Array.isArray(schema.collections)) {
		for (const c of schema.collections) {
			if (c.collection && !c.collection.startsWith('directus_')) {
				collections.add(c.collection);
			}
		}
	}
	return collections;
}
