import type { RestClient } from '@directus/sdk';
import type { ExtensionsServices, File } from '@directus/types';
import type { DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { blob } from 'node:stream/consumers';
import { readFiles, uploadFiles } from '@directus/sdk';
import { FormData } from 'formdata-node';

async function migrateFiles({ res, client, service, files, dry_run = false }: { res: any; client: RestClient<Schema>; service: InstanceType<ExtensionsServices['AssetsService']>; files: File[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!files) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No files found' }] };
	}
	else if (files.length === 0) {
		res.write('* No files to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Files' };
	}

	res.write(`* [Local] Found ${files.length} files\r\n\r\n`);

	try {
		// Fetch only the files we're interested in
		res.write('* [Remote] Fetching Existing Files ...');

		const existingFiles = await client.request(readFiles({
			fields: ['id', 'filename_disk'],
			limit: -1,
		}));

		if (!existingFiles)
			return { name: 'Directus Error', status: 404, errors: [{ message: 'Issue Fetching Files' }] };
		res.write('done\r\n\r\n');

		const existingFileIds = new Set(existingFiles.map((file) => file.id));
		const existingFileNames = new Set(existingFiles.map((file) => file.filename_disk));

		const filesToUpload = files.filter((file) => {
			if (existingFileIds.has(file.id)) {
				return false;
			}

			if (existingFileNames.has(file.filename_disk)) {
				return false;
			}

			return true;
		});

		res.write(filesToUpload.length > 0 ? `* [Remote] Uploading ${filesToUpload.length} ${filesToUpload.length > 1 ? 'Files' : 'File'}\r\n\r\n` : '* No Files to migrate\r\n\r\n');

		await Promise.all(filesToUpload.map(async (asset, index) => {
			const fileName = asset.filename_disk;
			let stream, stat;

			try {
				const ass = await service.getAsset(asset.id);
				stream = ass.stream;
				stat = ass.stat;
			}
			catch {
				res.write(`* [Remote] Error: Couldn't read ${fileName} (${asset.id}) from source [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
				return;
			}

			if (stat.size <= 0) {
				return;
			}

			if (!asset.type) {
				res.write(`* [Remote] Skipped ${fileName} (${asset.id}) [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
				return;
			}

			const form = new FormData();
			form.append('id', asset.id);
			if (asset.title)
				form.append('title', asset.title);
			if (asset.description)
				form.append('description', asset.description);
			if (asset.folder)
				form.append('folder', asset.folder);

			const myBlob = await blob(stream);
			form.append('file', myBlob.slice(0, myBlob.size, asset.type), fileName);

			res.write(`* [Remote] ${fileName} (${asset.id}) ${stat.size} bytes [${index + 1}/${filesToUpload.length}]\r\n\r\n`);

			if (dry_run) return;

			try {
				// @ts-expect-error-multipart-formdata
				await client.request(uploadFiles(form));
			}
			catch {
				res.write(`* [Remote] Error: Couldn't upload ${fileName} (${asset.id}) [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
			}
		}));

		return { response: 'Success', name: 'Files' };
	}
	catch (error) {
		console.error(error);
		const errorResponse = error as DirectusError;

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export default migrateFiles;
