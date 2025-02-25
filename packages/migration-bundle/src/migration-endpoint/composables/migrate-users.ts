import type { RestClient } from '@directus/sdk';
import type { DirectusError, RoleRaw, UserRaw } from '../../types/extension';
import type { Schema } from '../api';
import { createUser, readUsers } from '@directus/sdk';
import getRoleIds from '../../utils/get-role-ids';

async function migrateUsers({ res, client, users, roles, dry_run = false }: { res: any; client: RestClient<Schema>; users: UserRaw[] | null; roles: RoleRaw[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!users || !roles) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No users found' }] };
	}
	else if (users.length === 0) {
		res.write('* No users to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Users' };
	}
	else if (roles.length === 0) {
		res.write('* No roles found in the extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No roles found' }] };
	}

	res.write(`* [Local] Found ${users.length} users\r\n\r\n`);

	try {
		res.write('* [Remote] Fetching Existing Roles for users ...');
		const { legacyAdminRoleId, newAdminRoleId } = await getRoleIds(client, roles);
		const existingUsers = await client.request(readUsers({ limit: -1 }));
		if (!existingUsers)
			return { name: 'Directus Error', status: 404, errors: [{ message: 'No Users found in destination' }] };
		res.write('done\r\n\r\n');

		const filteredUsers = users.map((user) => {
			// If the user is an admin, we need to change their role to the new admin role
			const isAdmin = user.role === legacyAdminRoleId;
			user.role = isAdmin ? newAdminRoleId : user.role;

			// Delete the unneeded fields
			delete user.last_page;
			delete user.token;
			delete user.policies;
			// Delete passwords to prevent setting to *******
			delete user.password;

			return user;
		});

		res.write(filteredUsers.length > 0 ? `* [Remote] Uploading ${filteredUsers.length} ${filteredUsers.length > 1 ? 'Users' : 'User'} ` : '* No Users to migrate\r\n\r\n');

		if (filteredUsers.length > 0) {
			for await (const user of filteredUsers) {
				const existingUserWithSameId = existingUsers && Array.isArray(existingUsers)
					? existingUsers.find((existing) => existing.id === user.id)
					: undefined;

				const existingUserWithSameEmail = existingUsers && Array.isArray(existingUsers)
					? existingUsers.find((existing) => existing.email === user.email)
					: undefined;

				if (existingUserWithSameId) {
					// Skip if there's an existing user with the same id
					continue;
				}

				if (existingUserWithSameEmail) {
					// Delete email if there's an existing user with the same email but different id
					delete user.email;
				}

				if (user.email === null) {
					// Delete email if it's null
					delete user.email;
				}

				res.write('.');

				if (!dry_run) {
					// Create new role
					await client.request(createUser(user));
				}
			}

			res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
		}

		res.write('* User Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Users' };
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

export default migrateUsers;
