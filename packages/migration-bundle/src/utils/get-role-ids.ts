import type { RoleRaw } from '../types/extension';
import { Schema } from '../migration-endpoint/api';
import type { RestClient } from '@directus/sdk'
import { readMe } from '@directus/sdk'

const getRoleIds = async (client: RestClient<Schema>, roles: RoleRaw[]) => {

  // Legacy admin role may be undefined if the admin role was renamed in the source Directus project.
  const legacyAdminRoleId: string | undefined = roles.find(role => role.name === 'Administrator')?.id

  const currentUser = await client.request(readMe());

  const newAdminRoleId = currentUser.role as string;

  return { email: currentUser.email, legacyAdminRoleId, newAdminRoleId };
};

export default getRoleIds;