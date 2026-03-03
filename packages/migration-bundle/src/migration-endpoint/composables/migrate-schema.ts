import type { RestClient, SchemaDiffOutput, SchemaSnapshotOutput } from '@directus/sdk';
import type { DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { schemaApply, schemaDiff } from '@directus/sdk';
import { filterSchemaDiff, getCollectionsFromSchema } from '../../utils/filter-schema-diff';

export async function migrateSchema({ res, client, schema, dry_run = false, force = false }: { res: any; client: RestClient<Schema>; schema: SchemaSnapshotOutput; dry_run: boolean; force: boolean }): Promise<SchemaDiffOutput | DirectusError> {
	try {
		// Get collections from the filtered schema for diff filtering
		const schemaCollections = getCollectionsFromSchema(schema);

		// Debug: Log schema being sent (using res.write so it appears in output)
		res.write(`[DEBUG] Sending schema with ${schemaCollections.size} collections: ${Array.from(schemaCollections).join(', ')}\r\n`);
		res.write(`[DEBUG] Schema fields count: ${(schema as any).fields?.length || 0}\r\n`);
		res.write(`[DEBUG] Schema relations count: ${(schema as any).relations?.length || 0}\r\n\r\n`);

		res.write('1. Comparing Schemas ...');

		const rawDiff: SchemaDiffOutput = force
			? await client.request(() => ({
				body: JSON.stringify(schema),
				method: 'POST',
				path: '/schema/diff?force=true',
			}))
			: await client.request(schemaDiff(schema));

		// Filter the diff to exclude directus_* collections
		const diff = filterSchemaDiff(rawDiff, schemaCollections);

		// Debug: Log diff info BEFORE filtering
		if ('diff' in rawDiff && rawDiff.diff) {
			const rawCollections = rawDiff.diff.collections?.map((c: any) => c.collection) || [];
			res.write(`[DEBUG] RAW diff collections (${rawCollections.length}): ${rawCollections.join(', ')}\r\n`);
		}

		// Debug: Log diff info AFTER filtering
		if ('diff' in diff && diff.diff) {
			const filteredCollections = diff.diff.collections?.map((c: any) => c.collection) || [];
			const diffFields = diff.diff.fields?.length || 0;
			const diffRelations = diff.diff.relations?.length || 0;
			res.write(`[DEBUG] FILTERED diff collections (${filteredCollections.length}): ${filteredCollections.join(', ')}\r\n`);
			res.write(`[DEBUG] FILTERED diff: ${filteredCollections.length} collections, ${diffFields} fields, ${diffRelations} relations\r\n`);
		}

		if (!('hash' in diff)) {
			res.write('match\r\n\r\n');
		}
		else {
			// Check if filtered diff has any changes
			const hasChanges = (diff.diff?.collections?.length || 0) > 0 ||
				(diff.diff?.fields?.length || 0) > 0 ||
				(diff.diff?.relations?.length || 0) > 0;

			if (!hasChanges) {
				res.write('match (after filtering)\r\n\r\n');
			}
			else {
				res.write('done\r\n\r\n');

				res.write('2. Applying Schemas ...');

				if (!dry_run) {
					await (!force
						? client.request(schemaApply(diff))
						: client.request(() => ({
								body: JSON.stringify(diff),
								method: 'POST',
								path: '/schema/apply?force=true',
							})));

					res.write('done\r\n\r\n');
				}
				else {
					res.write('skipped\r\n\r\n');
				}
			}
		}

		return diff;
	}
	catch (error) {
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export async function checkSchema({ client, schema }: { client: RestClient<Schema>; schema: SchemaSnapshotOutput }): Promise<SchemaDiffOutput | DirectusError> {
	try {
		return await client.request(schemaDiff(schema));
	}
	catch (error) {
		const errorResponse = error as DirectusError;
		return errorResponse;
	}
}
