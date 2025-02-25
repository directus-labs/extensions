import type { DirectusError, Scope, UserCollectionItems, UserCollectionItem, DataExtract } from '../../types/extension';
import type { Accountability, SchemaOverview, File, Collection, Item } from '@directus/types';
import { directusFileFields } from '../../utils/system-fields';
import saveToFile from '../../utils/save-file';

const extractContent = async ({
  res,
  services,
  accountability,
  schema,
  scope,
  folder,
  storage
}: {
  res: any,
  services: any,
  accountability: Accountability,
  schema: SchemaOverview,
  scope: Scope,
  folder: string,
  storage: string,
}): Promise<DataExtract> => {

  const {
    CollectionsService,
    FieldsService,
    FilesService,
    ItemsService,
  } = services;

  const collectionService = new CollectionsService({ accountability: accountability, schema: schema });
  const fieldService = new FieldsService({ accountability: accountability, schema: schema });
  const fileService = new FilesService({ accountability: accountability, schema: schema });

  try {
    res.write('* Fetching collections');
    const collections: Collection[] = await collectionService.readByQuery({
      limit: -1
    });
    res.write(" ...done\r\n\r\n");

    res.write("* Fetching fields");
    const primaryKeyMap = await getCollectionPrimaryKeys(fieldService);
    res.write(" ...done\r\n\r\n");

    res.write('* Fetching full data');
    const fullData: UserCollectionItems[] = scope.content ? await loadFullData(collections, ItemsService, primaryKeyMap, accountability, schema) : [];
    res.write(" ...");
    await saveToFile(fullData, "items_full_data", fileService, folder, storage);
    res.write("done\r\n\r\n");

    res.write('* Fetching singletons');
    const singletons: UserCollectionItem[] = scope.content ? await loadSingletons(collections, ItemsService, accountability, schema) : [];
    res.write(" ...");
    await saveToFile(singletons, "items_singleton", fileService, folder, storage);
    res.write("done\r\n\r\n");

    res.write('* Fetching files');
    const files: File[] = scope.content ? await fileService.readByQuery({ fields: directusFileFields, filter: { _or: [ { folder: { _neq: folder } }, { folder: { _null: true } } ] }, limit: -1 }) : [];
    res.write(" ...");
    await saveToFile(files, "files", fileService, folder, storage);
    res.write("done\r\n\r\n");

    return {
      collections,
      fullData,
      singletons,
      files,
      data_errors: null,
    };
  } catch(error) {
    console.error(error);
    return {
      collections: null,
      fullData: null,
      singletons: null,
      files: null,
      data_errors: error as DirectusError,
    };
  }
};

const extractData = async (collection: string, ItemsService: any, accountability: Accountability, schema: SchemaOverview): Promise<Item[] | null> => {
  let page = 1;
  const limit = 100;
  let data: Item[] | null = [];

  const itemService = new ItemsService(collection, { accountability: accountability, schema: schema });

  while (true) {
    try {
      const response = await itemService.readByQuery({
        limit,
        page,
      });

      if (response.length === 0) break;
      for (const item of response) data.push(item);
      if (response.length < limit) break;
      page++;
    } catch (error) {
      console.error(error);
      data = null;
      break;
    }
  }

  return data;
};

const extractSingleton = async (collection: string, ItemsService: any, accountability: Accountability, schema: SchemaOverview): Promise<Item | null> => {
  const itemService = new ItemsService(collection, { accountability: accountability, schema: schema });
  return await itemService.readSingleton();
};

const loadFullData = async (collections: Collection[], itemService: any, primaryKeyMap: any, accountability: Accountability, schema: SchemaOverview): Promise<UserCollectionItems[]> => {
  
  const userCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.schema !== null)
  .filter(item => !item.meta?.singleton);

  return await Promise.all(userCollections.map(async collection => {
    const name = collection.collection;
    const primaryKeyField = getPrimaryKey(primaryKeyMap, name);
    return {
      collection: name,
      primaryKeyField: primaryKeyField,
      items: await extractData(name, itemService, accountability, schema),
    };
  }));
};

const loadSingletons = async (collections: Collection[], itemService: any, accountability: Accountability, schema: SchemaOverview): Promise<UserCollectionItem[]> => {
  
  const singletonCollections = collections
  .filter(item => !item.collection.startsWith('directus_', 0))
  .filter(item => item.meta?.singleton);

  return await Promise.all(singletonCollections.map(async collection => {
    const name = collection.collection;
    return {
      collection: name,
      item: await extractSingleton(name, itemService, accountability, schema),
    };
  }));
};

const getCollectionPrimaryKeys = async (fieldService: any) => {
  const fields = await fieldService.readAll();
  if(!fields) return;
  const primaryKeys: Record<string,string> = {};
  for (const field of fields) {
    if (field.schema && field.schema?.is_primary_key) {
      primaryKeys[field.collection] = field.field;
    }
  }

  return primaryKeys;
};

const getPrimaryKey = (collectionsMap: any, collection: string) => {
  if (!collectionsMap[collection]) {
    console.error(`Collection ${collection} not found in collections map`);
  }

  return collectionsMap[collection];
}

export default extractContent;