import type { RestClient } from '@directus/sdk';
import type { DirectusError, PolicyRaw } from '../../types/extension';
import { readPolicies, createPolicy } from '@directus/sdk';
import { Schema } from '../api';

const migratePolicies = async ({ res, client, policies, dry_run = false }: { res: any, client: RestClient<Schema>, policies: PolicyRaw[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {

  if(!policies){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No policies found"}]};
  } else if(policies.length == 0){
    res.write("* No policies to migrate\r\n\r\n");
    return { response: "Empty", name: "Policies" };
  }

  res.write(`* [Local] Found ${policies.length} policies\r\n\r\n`);
  try {
    // Fetch existing policies
    res.write("* [Remote] Fetching Existing Policies ...");
    const existingPolicies: PolicyRaw[] = await client.request(readPolicies({limit: -1}));
    if(!existingPolicies) return { name: "Directus Error", status: 404, errors: [{ message: "No Policies found"}]};
    res.write("done\r\n\r\n");

    const existingPolicyIds = new Set(existingPolicies.map(policy => policy.id));

    const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
    const policiesWithoutPublic = policies.filter(policy => policy.id !== PUBLIC_POLICY_ID);

    res.write(policiesWithoutPublic.length > 0 ? `* [Remote] Uploading ${policiesWithoutPublic.length} ${policiesWithoutPublic.length > 1 ? "Policies" : "Policy"} `: "* No Policies to migrate\r\n\r\n");
    if(policiesWithoutPublic.length > 0){
      let skipped = [];
      for await (const policy of policiesWithoutPublic) {
        if (existingPolicyIds.has(policy.id)) {
          skipped.push(policy.name);
          continue;
        }
        res.write(".");
        if(!dry_run){
          // Create new policy
          await client.request(createPolicy(policy));
        }

        // Add the new policy ID to our set of existing policies
        existingPolicyIds.add(policy.id);
      }
      res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");
      skipped.forEach((policy) => {
        res.write(`* Duplicate ID for ${policy} - skipped\r\n\r\n`);
      });
    }

    res.write("* Policy Migration Complete\r\n\r\n");
    return { response: "Success", name: "Policies" };

  } catch (error) {
    let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migratePolicies;