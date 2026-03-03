import type { Snapshot } from '@directus/types';
import type { Scope } from '../types/extension';

export function filterSchema(schema: Snapshot, scope: Scope): Snapshot {
	const { selectedCollections, excludedCollections } = scope;

	// Use process.stdout.write for logging (more reliable than console.log in some contexts)
	const log = (msg: string) => {
		try {
			process.stdout.write(`[filter-schema] ${msg}\n`);
		} catch {
			// Fallback to console.log if process.stdout is not available
			console.log(`[filter-schema] ${msg}`);
		}
	};

	log(`Input collections count: ${schema.collections?.length || 0}`);
	log(`Selected collections: ${JSON.stringify(selectedCollections || [])}`);
	log(`Excluded collections: ${JSON.stringify(excludedCollections || [])}`);

	// If no filtering specified, return full schema
	if ((!selectedCollections || selectedCollections.length === 0) &&
		(!excludedCollections || excludedCollections.length === 0)) {
		log('No filtering specified, returning full schema');
		return schema;
	}

	// Build initial set of included collections
	const includedCollections = new Set<string>();

	if (selectedCollections && selectedCollections.length > 0) {
		// Include mode: start with selected collections
		for (const collectionName of selectedCollections) {
			// Skip directus_* system collections - they should not be in filtered schema
			if (!collectionName.startsWith('directus_')) {
				includedCollections.add(collectionName);
			}
		}
	} else if (excludedCollections && excludedCollections.length > 0) {
		// Exclude mode: start with all non-system collections, remove excluded
		for (const c of schema.collections) {
			if (!c.collection.startsWith('directus_') && !excludedCollections.includes(c.collection)) {
				includedCollections.add(c.collection);
			}
		}
	}

	log(`Initial included collections (before group resolution): ${Array.from(includedCollections).join(', ')}`);

	// Recursively add parent groups
	// Collections can have a 'group' property in their meta that references a parent collection
	let changed = true;
	let iterations = 0;
	const maxIterations = 100; // Safety limit

	while (changed && iterations < maxIterations) {
		changed = false;
		iterations++;

		for (const c of schema.collections) {
			// If this collection is included and has a parent group
			if (includedCollections.has(c.collection)) {
				const parentGroup = (c as any).meta?.group;
				if (parentGroup && !parentGroup.startsWith('directus_') && !includedCollections.has(parentGroup)) {
					log(`Adding parent group '${parentGroup}' for collection '${c.collection}'`);
					includedCollections.add(parentGroup);
					changed = true;
				}
			}
		}
	}

	if (iterations >= maxIterations) {
		log('WARNING: Max iterations reached while resolving parent groups');
	}

	log(`Final included collections (after group resolution): ${Array.from(includedCollections).join(', ')}`);

	// Filter function
	const shouldInclude = (collectionName: string): boolean => {
		// Always exclude directus_* system collections from filtered schema
		if (collectionName.startsWith('directus_')) {
			return false;
		}
		return includedCollections.has(collectionName);
	};

	const result: Snapshot = {
		version: schema.version,
		directus: schema.directus,
		vendor: schema.vendor,
		collections: schema.collections.filter(c => shouldInclude(c.collection)),
		fields: schema.fields.filter(f => shouldInclude(f.collection)),
		relations: schema.relations.filter(r =>
			shouldInclude(r.collection) &&
			(r.related_collection === null || shouldInclude(r.related_collection))
		),
	};

	log(`Output: ${result.collections.length} collections, ${result.fields.length} fields, ${result.relations.length} relations`);

	return result;
}
