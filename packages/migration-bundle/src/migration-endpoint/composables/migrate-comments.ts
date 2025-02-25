import type { RestClient } from '@directus/sdk';
import type { CommentRaw, DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { createComments, readComments } from '@directus/sdk';

async function migrateComments({ res, client, comments, dry_run = false }: { res: any; client: RestClient<Schema>; comments: CommentRaw[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!comments) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No comments found' }] };
	}
	else if (comments.length === 0) {
		res.write('* No comments to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Comments' };
	}

	res.write(`* [Local] Found ${comments.length} comments\r\n\r\n`);

	try {
		// Fetch existing comments
		res.write('* [Remote] Fetching Existing Comments ...');

		const existingComments = await client.request(readComments({
			limit: -1,
		}));

		if (!existingComments)
			return { name: 'Directus Error', status: 404, errors: [{ message: 'Issue Fetching Comments' }] };
		res.write('done\r\n\r\n');

		const existingCommentIds = new Set(existingComments.map((comment) => comment.id));

		const commentsToAdd = comments.filter((comment) => {
			if (existingCommentIds.has(comment.id)) {
				return false;
			}

			return true;
		});

		res.write(commentsToAdd.length > 0 ? `* [Remote] Uploading ${commentsToAdd.length} ${commentsToAdd.length > 1 ? 'Comments' : 'Comment'} ` : '* No Comments to migrate\r\n\r\n');

		if (commentsToAdd.length > 0) {
			// Create the folders
			res.write('.');

			if (!dry_run) {
				await client.request(createComments(commentsToAdd));
			}

			res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
		}

		res.write('* Comments Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Comments' };
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

export default migrateComments;
