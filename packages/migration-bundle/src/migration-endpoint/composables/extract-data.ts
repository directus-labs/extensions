import type { Accountability, Collection, File, Item, SchemaOverview } from '@directus/types';
import type { DataExtract, DirectusError, Scope, UserCollectionItem, UserCollectionItems } from '../../types/extension';
import saveToFile from '../../utils/save-file';
import { directusFileFields } from '../../utils/system-fields';

async function extractContent({
	res,
	services,
	accountability,
	schema,
	scope,
	folder,
	storage,
}: {
	res: any;
	services: any;
	accountability: Accountability;
	schema: SchemaOverview;
	scope: Scope;
	folder: string;
	storage: string;
}): Promise<DataExtract> {
	const {
		CollectionsService,
		FieldsService,
		FilesService,
		ItemsService,
	} = services;

	const collectionService = new CollectionsService({ accountability, schema });
	const fieldService = new FieldsService({ accountability, schema });
	const fileService = new FilesService({ accountability, schema });

	try {
		res.write('* Fetching collections');

		// Load all collections first
		const allCollections: Collection[] = await collectionService.readByQuery({
			limit: -1,
		});

		// Fix 8: Filter collections based on scope (same logic as fullData/singletons)
		let collections = allCollections.filter(c => !c.collection.startsWith('directus_'));

		const hasContentFilter = scope.contentCollections && scope.contentCollections.length > 0;
		const hasSelectedFilter = scope.selectedCollections && scope.selectedCollections.length > 0;
		const hasExcludedFilter = scope.excludedCollections && scope.excludedCollections.length > 0;

		if (hasContentFilter || hasSelectedFilter) {
			// Build initial set of included collection names
			const selectedNames = hasContentFilter
				? scope.contentCollections!
				: scope.selectedCollections!;

			const includedNames = new Set<string>(selectedNames);

			// Recursively add parent groups (same logic as filter-schema.ts)
			let changed = true;
			let iterations = 0;
			const maxIterations = 100;

			while (changed && iterations < maxIterations) {
				changed = false;
				iterations++;
				for (const c of allCollections) {
					if (includedNames.has(c.collection) && c.meta?.group) {
						if (!includedNames.has(c.meta.group)) {
							includedNames.add(c.meta.group);
							changed = true;
						}
					}
				}
			}

			// Filter collections to only include selected + parent groups
			collections = collections.filter(c => includedNames.has(c.collection));
		}
		else if (hasExcludedFilter) {
			collections = collections.filter(c =>
				!scope.excludedCollections!.includes(c.collection)
			);
		}

		res.write(` (${collections.length} collections) ...done\r\n\r\n`);

		res.write('* Fetching fields');
		const primaryKeyMap = await getCollectionPrimaryKeys(fieldService);
		res.write(' ...done\r\n\r\n');

		res.write('* Fetching full data');
		const fullData: UserCollectionItems[] = scope.content ? await loadFullData(collections, ItemsService, primaryKeyMap, accountability, schema, scope) : [];
		res.write(' ...');
		await saveToFile(fullData, 'items_full_data', fileService, folder, storage);
		res.write('done\r\n\r\n');

		res.write('* Fetching singletons');
		const singletons: UserCollectionItem[] = scope.content ? await loadSingletons(collections, ItemsService, accountability, schema, scope) : [];
		res.write(' ...');
		await saveToFile(singletons, 'items_singleton', fileService, folder, storage);
		res.write('done\r\n\r\n');

		// Files: fetch if files is selected, or content is selected (backward compatibility)
		// Issue #009: Skip if selectedFolders is an empty array (explicit skip)
		const hasEmptyFolderSelection = Array.isArray(scope.selectedFolders) && scope.selectedFolders.length === 0;
		const shouldFetchFiles = !hasEmptyFolderSelection && (scope.files === true || (scope.content && scope.files !== false));
		res.write(shouldFetchFiles ? '* Fetching files' : '* Skipping files\r\n\r\n');

		let files: File[] = [];
		if (shouldFetchFiles) {
			// Fix 6.3: Filter files based on selectedCollections only (not contentCollections)
			// contentCollections is for content-specific filtering, files should be independent
			const contentCols = scope.selectedCollections?.length ? scope.selectedCollections : null;

			// Issue #009: Build folder filter if selectedFolders is specified
			const folderFilter = scope.selectedFolders && scope.selectedFolders.length > 0
				? { folder: { _in: scope.selectedFolders } }
				: { _or: [{ folder: { _neq: folder } }, { folder: { _null: true } }] };

			if (contentCols && contentCols.length > 0) {
				// Get file IDs from selected collections
				const fileIds = await getFileIdsFromCollections(contentCols, ItemsService, fieldService, accountability, schema);
				res.write(` (${fileIds.size} files from ${contentCols.length} collections)`);

				if (fileIds.size > 0) {
					files = await fileService.readByQuery({
						fields: directusFileFields,
						filter: {
							_and: [
								{ id: { _in: Array.from(fileIds) } },
								folderFilter,
							],
						},
						limit: -1,
					});
				}
			}
			else {
				// No collection filtering - get all files (with optional folder filter)
				files = await fileService.readByQuery({
					fields: directusFileFields,
					filter: folderFilter,
					limit: -1,
				});
			}

			// Issue #009: Log folder filtering if active
			if (scope.selectedFolders && scope.selectedFolders.length > 0) {
				res.write(` (folder filter: ${scope.selectedFolders.length} folders)`);
			}

			res.write(' ...');
			await saveToFile(files, 'files', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		return {
			collections,
			fullData,
			singletons,
			files,
			data_errors: null,
		};
	}
	catch (error) {
		console.error(error);
		return {
			collections: null,
			fullData: null,
			singletons: null,
			files: null,
			data_errors: error as DirectusError,
		};
	}
}

async function extractData(collection: string, ItemsService: any, accountability: Accountability, schema: SchemaOverview, primaryKeyField: string): Promise<Item[] | null> {
	let page = 1;
	const limit = 100;
	const sort = [primaryKeyField];
	let data: Item[] | null = [];

	const itemService = new ItemsService(collection, { accountability, schema });

	while (true) {
		try {
			const response = await itemService.readByQuery({
				limit,
				page,
				sort,
			});

			if (response.length === 0)
				break;
			for (const item of response) data.push(item);
			if (response.length < limit)
				break;
			page++;
		}
		catch (error) {
			console.error(error);
			data = null;
			break;
		}
	}

	return data;
}

async function extractSingleton(collection: string, ItemsService: any, accountability: Accountability, schema: SchemaOverview): Promise<Item | null> {
	const itemService = new ItemsService(collection, { accountability, schema });
	return await itemService.readSingleton({});
}

async function loadFullData(collections: Collection[], itemService: any, primaryKeyMap: any, accountability: Accountability, schema: SchemaOverview, scope: Scope): Promise<UserCollectionItems[]> {
	const userCollections = collections
		.filter((item) => !item.collection.startsWith('directus_', 0))
		.filter((item) => item.schema !== null)
		.filter((item) => !item.meta?.singleton)
		// Collection-level filtering for content
		// If contentCollections is specified, use that; otherwise fall back to selectedCollections/excludedCollections
		.filter((item) => {
			if (scope.contentCollections && scope.contentCollections.length > 0) {
				return scope.contentCollections.includes(item.collection);
			}
			if (scope.selectedCollections && scope.selectedCollections.length > 0) {
				return scope.selectedCollections.includes(item.collection);
			}
			if (scope.excludedCollections && scope.excludedCollections.length > 0) {
				return !scope.excludedCollections.includes(item.collection);
			}
			return true;
		});

	return await Promise.all(userCollections.map(async (collection) => {
		const name = collection.collection;
		const primaryKeyField = getPrimaryKey(primaryKeyMap, name);
		return {
			collection: name,
			primaryKeyField,
			items: await extractData(name, itemService, accountability, schema, primaryKeyField),
		};
	}));
}

async function loadSingletons(collections: Collection[], itemService: any, accountability: Accountability, schema: SchemaOverview, scope: Scope): Promise<UserCollectionItem[]> {
	const singletonCollections = collections
		.filter((item) => !item.collection.startsWith('directus_', 0))
		.filter((item) => item.meta?.singleton)
		// Collection-level filtering for content
		// If contentCollections is specified, use that; otherwise fall back to selectedCollections/excludedCollections
		.filter((item) => {
			if (scope.contentCollections && scope.contentCollections.length > 0) {
				return scope.contentCollections.includes(item.collection);
			}
			if (scope.selectedCollections && scope.selectedCollections.length > 0) {
				return scope.selectedCollections.includes(item.collection);
			}
			if (scope.excludedCollections && scope.excludedCollections.length > 0) {
				return !scope.excludedCollections.includes(item.collection);
			}
			return true;
		});

	return await Promise.all(singletonCollections.map(async (collection) => {
		const name = collection.collection;
		return {
			collection: name,
			item: await extractSingleton(name, itemService, accountability, schema),
		};
	}));
}

async function getCollectionPrimaryKeys(fieldService: any) {
	const fields = await fieldService.readAll();
	if (!fields)
		return;
	const primaryKeys: Record<string, string> = {};

	for (const field of fields) {
		if (field.schema && field.schema?.is_primary_key) {
			primaryKeys[field.collection] = field.field;
		}
	}

	return primaryKeys;
}

function getPrimaryKey(collectionsMap: any, collection: string) {
	if (!collectionsMap[collection]) {
		console.error(`Collection ${collection} not found in collections map`);
	}

	return collectionsMap[collection];
}

// Fix 6.3: Get file IDs from selected collections
async function getFileIdsFromCollections(
	collections: string[],
	ItemsService: any,
	fieldService: any,
	accountability: Accountability,
	schema: SchemaOverview,
): Promise<Set<string>> {
	const fileIds = new Set<string>();

	// Get all fields to find file-type fields
	const allFields = await fieldService.readAll();
	if (!allFields) return fileIds;

	// Find file-type fields in selected collections
	const fileFields: Array<{ collection: string; field: string }> = [];
	for (const field of allFields) {
		if (!collections.includes(field.collection)) continue;

		// Check for file field (uuid with file interface or special)
		const isFileField = field.type === 'uuid' &&
			(field.meta?.interface === 'file' ||
				field.meta?.interface === 'file-image' ||
				field.meta?.special?.includes('file'));

		if (isFileField) {
			fileFields.push({ collection: field.collection, field: field.field });
		}
	}

	// Query each collection for file IDs
	for (const { collection, field } of fileFields) {
		try {
			const itemService = new ItemsService(collection, { accountability, schema });
			const items = await itemService.readByQuery({
				fields: [field],
				filter: { [field]: { _nnull: true } },
				limit: -1,
			});

			for (const item of items) {
				if (item[field]) {
					fileIds.add(item[field]);
				}
			}
		}
		catch (error) {
			console.error(`Failed to get files from ${collection}.${field}:`, error);
		}
	}

	return fileIds;
}

export default extractContent;
