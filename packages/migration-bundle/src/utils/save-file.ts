import { createTmpFile } from './create-tmp';
import { appendFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import type { JSONInput } from '../types/extension';
import type { Settings } from '@directus/types';

const saveToFile = async (json: JSONInput[] | Settings, name: string, fileService: any, folder: string, storage: string) => {
  const tmpFile = await createTmpFile().catch(() => null);
  if(!tmpFile) return;
  
  let data = JSON.stringify(json);
  await appendFile(
    tmpFile.path,
    data,
  );
  return await fileService.uploadOne(createReadStream(tmpFile.path), {
    title: name,
    folder: folder,
    filename_download: `${name}.json`,
    storage: storage,
    type: "application/json",
  });
};

export default saveToFile;