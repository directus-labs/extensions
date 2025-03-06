import type { RestClient } from '@directus/sdk';
import type { DirectusError, OperationRaw } from '../../types/extension';
import type { Schema } from '../api';
import { createOperations, updateOperation } from '@directus/sdk';

async function migrateOperations({ res, client, operations, dry_run = false }: { res: any; client: RestClient<Schema>; operations: OperationRaw[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!operations) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No operations found' }] };
	}
	else if (operations.length === 0) {
		res.write('* No operations to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Operations' };
	}

	res.write(`* [Local] Found ${operations.length} operations\r\n\r\n`);

	try {
		const operationIds = operations.map((operation) => {
			const operationCopy = { ...operation };
			delete operationCopy.reject;
			delete operationCopy.resolve;
			return operationCopy;
		});

		res.write(operationIds.length > 0 ? `* [Remote] Uploading ${operationIds.length} ${operationIds.length > 1 ? 'Operations' : 'Operation'} ...` : '* No Operations to migrate\r\n\r\n');

		if (!dry_run) {
			await client.request(createOperations(operationIds));
		}

		res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');

		const results = await Promise.allSettled(operations.map((operation) =>
			client.request(updateOperation(operation.id, {
				reject: operation.reject,
				resolve: operation.resolve,
			})),
		));

		for (const [index, result] of results.entries()) {
			if (result.status === 'rejected') {
				res.write(`* Error on Operation ${index}: ${result.reason}`);
			}
		}

		res.write('* Operation Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Operations' };
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

export default migrateOperations;
