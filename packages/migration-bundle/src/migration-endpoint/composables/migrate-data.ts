import type { RestClient } from '@directus/sdk';
import type { Item } from '@directus/types';
import type { DirectusError, UserCollectionItem, UserCollectionItems } from '../../types/extension';
import type { Schema } from '../api';
import { createItems, readItems, updateItemsBatch, updateSingleton } from '@directus/sdk';
import { chunkArray } from '../../utils/chunk-array';

const BATCH_SIZE = 50;

async function migrateData({
	res,
	client,
	fullData,
	singletons,
	dry_run = false,
}: {
	res: any;
	client: RestClient<Schema>;
	fullData: UserCollectionItems[] | null;
	singletons: UserCollectionItem[] | null;
	dry_run: boolean;
}): Promise<{ response: string; name: string } | DirectusError> {
	if (!fullData || !singletons) {
		res.write('* Couldn\'t read content from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No content found' }] };
	}
	else if (fullData.length === 0 && singletons.length === 0) {
		res.write('* No content to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Content' };
	}

	if (fullData) {
		await loadSkeletonRecords(res, client, fullData, dry_run);
		await loadFullData(res, client, fullData, dry_run);
	}

	if (singletons) {
		await loadSingletons(res, client, singletons, dry_run);
	}

	return { response: 'Success', name: 'Content' };
}

async function loadSkeletonRecords(res: any, client: any, skeletonRecords: UserCollectionItems[], dry_run: boolean) {
	res.write('* Loading skeleton records\r\n\r\n');

	await Promise.all(skeletonRecords.map(async (collection) => {
		const name = collection.collection;
		const primaryKeyField = collection.primaryKeyField;
		const data = collection.items;

		// Fetch existing primary keys
		res.write(`* [Remote] Fetching existing data for ${name} ...`);
		const existingPrimaryKeys = await getExistingPrimaryKeys(res, client, name, primaryKeyField);
		res.write('done\r\n\r\n');

		// Filter out existing records
		const newData = data?.filter((entry) => !existingPrimaryKeys.has(entry[primaryKeyField]));

		if (!newData || newData.length === 0) {
			res.write(`* Skipping ${name}: No new records to add\r\n\r\n`);
			return;
		}

		const batches = chunkArray(newData, BATCH_SIZE).map((batch: Item[]) =>
			batch.map((entry) => ({ [primaryKeyField]: entry[primaryKeyField] })),
		);

		await Promise.all(batches.map(async (batch: Item[], index: number) => {
			res.write(`    * [Remote] Uploading ${name} content ${index + 1} of ${batches.length}\r\n\r\n`);
			await uploadBatch(res, client, name, batch, createItems, dry_run);
			// res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");
		}));

		res.write(`* ${newData.length} ${newData.length > 1 ? 'records' : 'record'} ${dry_run ? 'processed for' : 'uploaded to'} ${name}\r\n\r\n`);
	}));

	res.write('* Skeleton records migrated\r\n\r\n\r\n\r\n');
}

async function getExistingPrimaryKeys(res: any, client: any, collection: string, primaryKeyField: string): Promise<Set<any>> {
	const existingKeys = new Set();
	let page = 1;
	const limit = 100; // Adjust based on your needs and API limits

	res.write(`* [Remote] Fetching ${collection} primary keys\r\n\r\n`);

	while (true) {
		try {
			// @ts-expect-error string
			const response = await client.request(readItems(collection, {
				fields: [primaryKeyField],
				limit,
				page,
			}));

			if (response.length === 0)
				break;
			for (const item of response) existingKeys.add(item[primaryKeyField]);
			if (response.length < limit)
				break;
			page++;
		}
		catch (error) {
			console.error(error);
			const errorResponse = error as DirectusError;

			if (errorResponse.errors && errorResponse.errors.length > 0) {
				res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
			}

			break;
		}
	}

	res.write('done\r\n\r\n');
	return existingKeys;
}

// eslint-disable-next-line ts/no-unsafe-function-type
async function uploadBatch(res: any, client: any, collection: string, batch: Item[], method: Function, dry_run: boolean) {
	try {
		if (!dry_run) {
			await client.request(method(collection, batch));
		}
	}
	catch (error) {
		console.error(error);
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}
	}
}

async function loadFullData(res: any, client: any, fullData: UserCollectionItems[], dry_run: boolean) {
	res.write('* Updating records with full data\r\n\r\n');

	await Promise.all(fullData.map(async (collection) => {
		const name = collection.collection;
		const data = collection.items;

		if (!data)
			return;

		const batches = chunkArray(data, BATCH_SIZE).map((batch: Item[]) =>
			batch.map(({ user_created, user_updated, ...cleanedRow }) => cleanedRow),
		);

		let count = 0;

		await Promise.all(batches.map(async (batch: Item[]) => {
			count++;
			res.write(`* [Remote] Uploading ${name} content ${count} of ${batches.length}\r\n\r\n`);
			await uploadBatch(res, client, name, batch, updateItemsBatch, dry_run);
		}));
	}));

	res.write('* All collections updated with full data\r\n\r\n');
}

async function loadSingletons(res: any, client: any, singleton: UserCollectionItem[], dry_run: boolean) {
	res.write('* Loading data for singleton collections ..');

	await Promise.all(singleton.map(async (collection) => {
		const name = collection.collection;
		const data = collection.item;

		try {
			const { user_created, user_updated, ...cleanedData } = data as any;
			res.write('.');

			if (!dry_run) {
				// @ts-expect-error string
				await client.request(updateSingleton(name, cleanedData));
			}
		}
		catch (error) {
			console.error(error);
			const errorResponse = error as DirectusError;
			res.write('error\r\n\r\n');

			if (errorResponse.errors && errorResponse.errors.length > 0) {
				res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
			}

			return errorResponse;
		}
	}));

	res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
	res.write('* Loaded data for singleton collections\r\n\r\n');
}

export default migrateData;
