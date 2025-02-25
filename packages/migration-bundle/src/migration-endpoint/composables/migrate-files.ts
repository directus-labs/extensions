import type { RestClient } from '@directus/sdk';
import type { File } from '@directus/types';
import type { DirectusError } from '../../types/extension';
import { readFiles, uploadFiles } from '@directus/sdk';
import { FormData } from 'formdata-node';
import { Schema } from '../api';
import { createTmpFile } from '../../utils/create-tmp';
import { appendFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

const migrateFiles = async ({ res, client, service, files, dry_run = false }: { res: any, client: RestClient<Schema>, service: any, files: File[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {
  
  if(!files){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No files found"}]};
  } else if(files.length == 0){
    res.write("* No files to migrate\r\n\r\n");
    return { response: "Empty", name: "Files" };
  }

  res.write(`* [Local] Found ${files.length} files\r\n\r\n`);

  try {
    // Fetch only the files we're interested in
    res.write("* [Remote] Fetching Existing Files ...");
    const existingFiles = await client.request(readFiles({
      fields: ['id', 'filename_disk'],
      limit: -1,
    }));

    if(!existingFiles) return { name: "Directus Error", status: 404, errors: [{ message: "Issue Fetching Files"}]}; 
    res.write("done\r\n\r\n");

    const existingFileIds = new Set(existingFiles.map(file => file.id));
    const existingFileNames = new Set(existingFiles.map(file => file.filename_disk));

    const filesToUpload = files.filter(file => {
      if (existingFileIds.has(file.id)) {
        return false;
      }

      if (existingFileNames.has(file.filename_disk)) {
        return false;
      }

      return true;
    });

    res.write(filesToUpload.length > 0 ? `* [Remote] Uploading ${filesToUpload.length} ${filesToUpload.length > 1 ? "Files" : "File" }\r\n\r\n`: "* No Files to migrate\r\n\r\n");
    await Promise.all(filesToUpload.map(async (asset, index) => {
      const fileName = asset.filename_disk;
      const { stream, stat } = await service.getAsset(asset.id);
      if(stat.size > 0) {
        if(!asset.type){
          res.write(`* [Remote] Skipped ${fileName} [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
        } else {
          const tmpFile = await createTmpFile().catch(() => null);
          if(!tmpFile) {
            res.write(`* [Remote] Error: Couldn't write ${fileName} to disk [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
          } else {
            await appendFile(tmpFile.path, stream);
            const fileStream = new Blob([readFileSync(tmpFile.path)], {type: asset.type});

            const form = new FormData();
            form.append('id', asset.id);
            if (asset.title) form.append('title', asset.title);
            if (asset.description) form.append('description', asset.description);
            if (asset.folder) form.append('folder', asset.folder);
            form.append('file', fileStream, fileName);

            res.write(`* [Remote] ${fileName} ${stat.size} bytes [${index + 1}/${filesToUpload.length}]\r\n\r\n`);
            if(!dry_run){
              // @ts-ignore
              await client.request(uploadFiles(form));
            }

            tmpFile.cleanup().catch(() => {
          		res.write(`* Failed to cleanup temporary import file (${tmpFile.path})`);
          	});
          }
        }
      }

    }));

    return { response: "Success", name: "Files" };

  } catch (error) {
    console.error(error);
    let errorResponse = error as DirectusError;
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migrateFiles;