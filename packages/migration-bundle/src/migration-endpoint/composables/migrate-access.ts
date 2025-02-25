import type { RestClient } from '@directus/sdk';
import type { DirectusError, Access, RoleRaw } from '../../types/extension';
import getRoleIds from '../../utils/get-role-ids';
import { Schema } from '../api';

const migrateAccess = async ({ res, client, access, roles, dry_run = false }: { res: any, client: RestClient<Schema>, access: Access[] | null, roles: RoleRaw[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {

	if(!access || !roles){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No access records found"}]};
  } else if(access.length == 0){
    res.write("* No access records to migrate\r\n\r\n");
    return { response: "Empty", name: "Access" };
  }

  res.write(`* [Local] Using ${access.length} access records\r\n\r\n`);

	try {
		
		// Fetch existing accesses
		res.write("* [Remote] Fetching Existing Access ...");
		const existingAccesses = await client.request(() => ({
      method: 'GET',
      params: {
        limit: -1,
      },
      path: '/access',
    })) as Access[];
		if(!existingAccesses) return { name: "Directus Error", status: 404, errors: [{ message: "Issue Fetching Access"}]};
		res.write("done\r\n\r\n");

		const { legacyAdminRoleId, newAdminRoleId } = roles ? await getRoleIds(client, roles) : { legacyAdminRoleId: null, newAdminRoleId: null };

		const existingAccessById = new Map(existingAccesses.map(acc => [acc.id, acc]));
		const existingAccessByCompositeKey = new Map(existingAccesses.map(acc => [getCompositeKey(acc), acc]));

		res.write(`* [Remote] Uploading ${access.length} ${access.length > 1 ? "Access record" : "Access records"} `);
		for await (const acc of access) {
			if (existingAccessById.has(acc.id)) {
				continue;
			}

			const compositeKey = getCompositeKey(acc);
			if (existingAccessByCompositeKey.has(compositeKey)) {
				continue;
			}

			// If the role is null, delete the role key to avoid errors
			if (acc.role === null) {
				delete acc.role;
			}

			// If the role is the legacy admin role, update it to the new admin role
			if (acc.role === legacyAdminRoleId) {
				acc.role = newAdminRoleId;
			}

			res.write(".");
      if(!dry_run){
				await client.request(() => ({
					body: JSON.stringify(acc),
					method: 'POST',
					path: '/access',
				}));
			}

			// Add the new access to our maps
			existingAccessById.set(acc.id, acc);
			existingAccessByCompositeKey.set(compositeKey, acc);
		}

		res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");
		res.write("* Access Migration Complete\r\n\r\n");
		return { response: "Success", name: "Access" };

	} catch (error) {
		let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
	}
}

// Helper function to generate a composite key for each access
function getCompositeKey(acc: Access): string {
	return `${acc.role ?? 'null'}-${acc.user ?? 'null'}-${acc.policy}`;
}

export default migrateAccess;