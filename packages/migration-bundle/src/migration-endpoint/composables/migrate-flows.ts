import type { RestClient } from '@directus/sdk';
import type { DirectusError, OperationRaw, ModifiedFlowRaw } from '../../types/extension';
import { readFlows, createFlow } from '@directus/sdk';
import { Schema } from '../api';
import migrateOperations from './migrate-operations';

const migrateFlows = async ({ res, client, flows, operations, dry_run = false }: { res: any, client: RestClient<Schema>, flows: ModifiedFlowRaw[] | null, operations: OperationRaw[] | null, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {
  
  if(!flows || !operations){
    res.write("* Couldn't read data from extract\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No flows found"}]};
  } else if(flows.length == 0){
    res.write("* No flows to migrate\r\n\r\n");
    return { response: "Empty", name: "Flows" };
  } else if(operations.length == 0){
    res.write("* No operations to migrate\r\n\r\n");
    return { response: "Empty", name: "Operations" };
  }

  res.write(`* [Local] Found ${flows.length} flows\r\n\r\n`);

  try {
    // Fetch existing Flows
    res.write("* [Remote] Fetching Existing Flows ...");
    const existingFlows = await client.request(readFlows({
      limit: -1,
    }));
    if(!existingFlows) return { name: "Directus Error", status: 404, errors: [{ message: "Issue Fetching Flows"}]};
    res.write("done\r\n\r\n");

    const existingFlowIds = new Set(existingFlows.map(flow => flow.id));
    const newFlows = flows.filter(flow => !existingFlowIds.has(flow.id));

    res.write(newFlows.length > 0 ? `* [Remote] Uploading ${newFlows.length} ${newFlows.length > 1 ? "Flows" : "Flow" } `: "* No Flows to migrate\r\n\r\n");
    if(newFlows.length > 0){
      const results = await Promise.allSettled(newFlows.map((flow) => {
        res.write(".");
        return !dry_run ? client.request(createFlow(flow)) : null;
      }));
      res.write(dry_run ? "skipped\r\n\r\n":"done\r\n\r\n");

      const createdFlowIds = new Set<string>();
      for (const [index, result] of results.entries()) {
        if (result.status === 'fulfilled' && newFlows[index]) {
          createdFlowIds.add(newFlows[index].id)
        } else if("reason" in result) {
          res.write(`* [Error] ${result.reason}`);
        }
      }

      // Filter operations for newly created flows
      const newOperations = operations.filter(operation => createdFlowIds.has(operation.flow));
      await migrateOperations({ res, client, operations: newOperations, dry_run });
    }

    res.write("* Flows Migration Complete\r\n\r\n");
    return { response: "Success", name: "Flows" };

  } catch (error) {
    let errorResponse = error as DirectusError;
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migrateFlows;