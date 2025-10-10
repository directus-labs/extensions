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

		const collections: Collection[] = await collectionService.readByQuery({
			limit: -1,
		});

		res.write(' ...done\r\n\r\n');

		res.write('* Fetching fields');
		const primaryKeyMap = await getCollectionPrimaryKeys(fieldService);
		res.write(' ...done\r\n\r\n');

		res.write('* Fetching full data');
		const fullData: UserCollectionItems[] = scope.content ? await loadFullData(collections, ItemsService, primaryKeyMap, accountability, schema) : [];
		res.write(' ...');
		await saveToFile(fullData, 'items_full_data', fileService, folder, storage);
		res.write('done\r\n\r\n');

		res.write('* Fetching singletons');
		const singletons: UserCollectionItem[] = scope.content ? await loadSingletons(collections, ItemsService, accountability, schema) : [];
		res.write(' ...');
		await saveToFile(singletons, 'items_singleton', fileService, folder, storage);
		res.write('done\r\n\r\n');

		res.write('* Fetching files');
		const files: File[] = scope.content ? await fileService.readByQuery({ fields: directusFileFields, filter: { _or: [{ folder: { _neq: folder } }, { folder: { _null: true } }] }, limit: -1 }) : [];
		res.write(' ...');
		await saveToFile(files, 'files', fileService, folder, storage);
		res.write('done\r\n\r\n');

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

async function loadFullData(collections: Collection[], itemService: any, primaryKeyMap: any, accountability: Accountability, schema: SchemaOverview): Promise<UserCollectionItems[]> {
	const userCollections = collections
		.filter((item) => !item.collection.startsWith('directus_', 0))
		.filter((item) => item.schema !== null)
		.filter((item) => !item.meta?.singleton);

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

async function loadSingletons(collections: Collection[], itemService: any, accountability: Accountability, schema: SchemaOverview): Promise<UserCollectionItem[]> {
	const singletonCollections = collections
		.filter((item) => !item.collection.startsWith('directus_', 0))
		.filter((item) => item.meta?.singleton);

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

export default extractContent;
