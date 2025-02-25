import type { RestClient, SchemaSnapshotOutput, SchemaDiffOutput } from '@directus/sdk'
import type { DirectusError } from '../../types/extension';
import { schemaDiff, schemaApply } from '@directus/sdk';
import { Schema } from '../api';

export const migrateSchema = async ({ res, client, schema, dry_run = false, force = false }: { res: any, client: RestClient<Schema>, schema: SchemaSnapshotOutput, dry_run: boolean, force: boolean }): Promise<SchemaDiffOutput | DirectusError> => {
  try {
    res.write("1. Comparing Schemas ...");
    const diff: SchemaDiffOutput = force ? await client.request(() => ({
      body: JSON.stringify(schema),
      method: 'POST',
      path: '/schema/diff?force=true',
    })) : await client.request(schemaDiff(schema));
    if(!("hash" in diff)){
      res.write("match\r\n\r\n");
    } else {
      res.write("done\r\n\r\n");

      res.write("2. Applying Schemas ...");
      if(!dry_run){
        if(!force){
          await client.request(schemaApply(diff));
        } else {
          await client.request(() => ({
            body: JSON.stringify(diff),
            method: 'POST',
            path: '/schema/apply?force=true',
          }));
        }
        res.write("done\r\n\r\n");
      } else {
        res.write("skipped\r\n\r\n");
      }
    }

    return diff;

  } catch (error) {
    let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export const checkSchema = async ({ client, schema }: { client: RestClient<Schema>, schema: SchemaSnapshotOutput }): Promise<SchemaDiffOutput | DirectusError> => {
  try {
    return await client.request(schemaDiff(schema));
  } catch (error) {
    let errorResponse = error as DirectusError;
    return errorResponse;
  }
};