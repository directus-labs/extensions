import type { Settings } from '@directus/types';
import type { JSONInput } from '../types/extension';
import { createReadStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { createTmpFile } from './create-tmp';

async function saveToFile(json: JSONInput[] | Settings, name: string, fileService: any, folder: string, storage: string) {
	const tmpFile = await createTmpFile().catch(() => null);
	if (!tmpFile)
		return;

	const data = JSON.stringify(json);

	await appendFile(
		tmpFile.path,
		data,
	);

	return await fileService.uploadOne(createReadStream(tmpFile.path), {
		title: name,
		folder,
		filename_download: `${name}.json`,
		storage,
		type: 'application/json',
	});
}

export default saveToFile;
