import type { RestClient } from '@directus/sdk';
import type { Permission } from '@directus/types';
import type { DirectusError } from '../../types/extension';
import { readPermissions, createPermission } from '@directus/sdk';
import { Schema } from '../api';

const migratePermissions = async ({ res, client, permissions, dry_run = false }: { res: any, client: RestClient<Schema>, permissions: Permission[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {

  if(!permissions){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No permissions found"}]};
  } else if(permissions.length == 0){
    res.write("* No permissions to migrate\r\n\r\n");
    return { response: "Empty", name: "Permissions" };
  }

  res.write(`* [Local] Found ${permissions.length} permissions\r\n\r\n`);

  try {
    // Fetch existing policies
    res.write("* [Remote] Fetching Existing Permissions ...");
    const existingPermissions = await client.request(readPermissions({limit: -1}));
    if(!existingPermissions) return { name: "Directus Error", status: 404, errors: [{ message: "No Permissions found"}]};
    res.write("done\r\n\r\n");

    const existingPermissionKeys = new Set(
      existingPermissions.map(p => `${p.collection}:${p.action}:${p.policy}`),
    );

    // Filter out duplicates
    const newPermissions = permissions.filter(newPerm =>
      !existingPermissionKeys.has(`${newPerm.collection}:${newPerm.action}:${newPerm.policy}`),
    );
    
    res.write(newPermissions.length > 0 ? `* [Remote] Uploading ${newPermissions.length} ${newPermissions.length > 1 ? "Permissions" : "Permission"} `: "* No Permissions to migrate\r\n\r\n");
    if(newPermissions.length > 0){
      for await (const permission of newPermissions) {
        res.write(".");
        if(!dry_run){
          // Create new permission
          await client.request(createPermission(permission));
        }
      }
      res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");
    }

    res.write("* Permission Migration Complete\r\n\r\n");
    return { response: "Success", name: "Permissions" };

  } catch (error) {
    let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migratePermissions;