import type { RestClient } from '@directus/sdk';
import type { DirectusError, Folder } from '../../types/extension';
import { createFolders, readFolders, updateFolder } from '@directus/sdk';
import { Schema } from '../api';

const migrateFolders = async ({ res, client, folders, dry_run = false }: { res: any, client: RestClient<Schema>, folders: Folder[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {
  
  if(!folders){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No folders found"}]};
  } else if(folders.length == 0){
    res.write("* No folders to migrate\r\n\r\n");
    return { response: "Empty", name: "Folders" };
  }

  res.write(`* [Local] Found ${folders.length} folders\r\n\r\n`);

  try {
    // Fetch existing folders
    res.write("* [Remote] Fetching Existing Folders ...");
    const existingFolders = await client.request(readFolders({
      limit: -1,
    }));
    if(!existingFolders) return { name: "Directus Error", status: 404, errors: [{ message: "Issue Fetching Folders"}]};
    res.write("done\r\n\r\n");

    const existingFolderIds = new Set(existingFolders.map(folder => folder.id))

    const foldersToAdd = folders.filter(folder => {
      if (existingFolderIds.has(folder.id)) {
        return false;
      }
      return true;
    });

    res.write(foldersToAdd.length > 0 ? `* [Remote] Uploading ${foldersToAdd.length} ${foldersToAdd.length > 1 ? "Folders" : "Folder"} `: "* No Folders to migrate\r\n\r\n");
    if (foldersToAdd.length > 0) {
      const folderSkeleton = foldersToAdd.map(folder => ({id: folder.id, name: folder.name}));

      // Create the folders
      res.write(".");
      await client.request(createFolders(folderSkeleton));

      // Update the folders with relationships concurrently
      await Promise.all(foldersToAdd.map(async folder => {
        const {id, ...rest} = folder;
        res.write(".");
        await client.request(updateFolder(id, rest));
      }));

      res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");
    }

    res.write("* Folder Migration Complete\r\n\r\n");
    return { response: "Success", name: "Folders" };

  } catch (error) {
    let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migrateFolders;