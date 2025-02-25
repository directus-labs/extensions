import type { RestClient } from '@directus/sdk';
import type { DirectusError, RoleRaw } from '../../types/extension';
import type { Schema } from '../api';
import { createRole, readRoles, updateRole } from '@directus/sdk';
import getRoleIds from '../../utils/get-role-ids';

async function migrateRoles({ res, client, roles, dry_run }: { res: any; client: RestClient<Schema>; roles: RoleRaw[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!roles) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No roles found' }] };
	}
	else if (roles.length === 0) {
		res.write('* No roles to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Roles' };
	}

	res.write(`* [Local] Found ${roles.length} roles\r\n\r\n`);

	const { legacyAdminRoleId, newAdminRoleId } = await getRoleIds(client, roles);

	// Fetch existing roles
	res.write('* [Remote] Fetching Existing Roles ...');

	const existingRoles = await client.request(readRoles({
		limit: -1,
	}));

	if (!existingRoles)
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No Roles found' }] };
	res.write('done\r\n\r\n');
	const existingRoleIds = new Set(existingRoles.map((role) => role.id));
	const existingRoleNames = new Set(existingRoles.map((role) => role.name.toLowerCase()));

	const cleanedUpRoles = roles
		.filter((role) => role.name !== 'Administrator') // Don't load legacy admin role
		.filter((role) => !existingRoleNames.has(role.name.toLowerCase())) // Filter out roles with existing names
		.map((role) => {
			const r = { ...role } as RoleRaw;
			delete r.users; // Alias field. User roles will be applied when the users are loaded.
			delete r.parent; // We need to load all roles first
			return r;
		});

	const errors = [];

	res.write(cleanedUpRoles.length > 0 ? `* [Remote] Uploading ${cleanedUpRoles.length} ${cleanedUpRoles.length > 1 ? 'Roles' : 'Role'} ` : '* No Roles to migrate\r\n\r\n');

	if (cleanedUpRoles.length > 0) {
		for await (const role of cleanedUpRoles) {
			try {
				if (existingRoleIds.has(role.id)) {
					continue;
				}

				res.write('.');

				if (!dry_run) {
					// Create new role
					await client.request(createRole(role));
				}

				// Add the new role ID and name to our sets of existing roles
				existingRoleIds.add(role.id);
				existingRoleNames.add(role.name.toLowerCase());
			}
			catch (error) {
				errors.push(error as DirectusError);
			}
		}

		res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
	}

	// Now add in any parent fields
	const rolesWithParents = roles.filter((role) => role.parent !== null);
	res.write(rolesWithParents.length > 0 ? `* [Remote] Updating ${rolesWithParents.length} Roles with parents ` : '* No Roles to update\r\n\r\n');

	if (rolesWithParents.length > 0) {
		for await (const role of rolesWithParents) {
			try {
				// Remap any roles where the parent ID is the default admin role
				if (role.parent === legacyAdminRoleId) {
					role.parent = newAdminRoleId;
				}

				const simplifiedRole = { parent: role.parent as string };
				res.write('.');

				if (!dry_run) {
					// Update role
					await client.request(updateRole(role.id, simplifiedRole));
				}
			}
			catch (error) {
				errors.push(error as DirectusError);
			}
		}

		res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
	}

	res.write('* Roles Migration Complete\r\n\r\n');

	errors.forEach((e) => {
		res.write(`${e.errors[0]?.message}\r\n\r\n`);
	});

	return errors.length > 0 ? { name: 'Roles Migration Error', errors: errors.map((e) => e.errors[0]) } as DirectusError : { response: 'Success', name: 'Roles' };
}

export default migrateRoles;
