import type { RestClient } from '@directus/sdk';
import type { DirectusError } from '../../types/extension';
import type { Collection, Field } from '@directus/types';
import { updateField } from '@directus/sdk';
import { Schema } from '../api';

const updateRequiredFields = async ({ res, client, service, collections, dry_run = false, task }: { res: any, client: RestClient<Schema>, service: any, collections: Collection[] | null, dry_run: boolean, task: "add" | "remove" }): Promise<{ response: string, name: string } | DirectusError> => {
  
  const fields: Field[] = await service.readAll();

  if(!fields || fields.length == 0){
    res.write("* No fields to update\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No fields found"}]};
  } else if(!collections || collections.length == 0){
    res.write("* No collections found\r\n\r\n");
    return { name: "Directus Error", status: 404, errors: [{ message: "No collections found"}]};
  }

  const userCollections = collections.filter(
    collection => !collection.collection.startsWith('directus_'),
  );

  let errors = [];
  for await (const collection of userCollections) {

    const fieldsToUpdate = fields.filter(field => 
      field.collection === collection.collection && field.schema?.is_primary_key === false &&
      (field.meta?.required === true || field.schema?.is_nullable === false || field.schema?.is_unique === true)
    ).map(field => task == "remove" ? removeRequiredorIsNullable(field) : field);

    res.write(`* [Remote] Updating ${fieldsToUpdate.length} fields in ${collection.collection}\r\n\r\n`);
    for await (const field of fieldsToUpdate) {
      try {
        res.write(`    * [Remote] Updating ${field.field} meta and schema\r\n\r\n`);
        if(!dry_run){
          await client.request(updateField(field.collection, field.field, {meta: {...field.meta}, schema: {...field.schema}}));
        }
      } catch (error) {
        let errorResponse = error as DirectusError;
        if(errorResponse.errors && errorResponse.errors.length > 0){
          res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
        }
        errors.push(errorResponse);
      }
    }
  }

  return errors.length > 0 ? { name: "Required Fields Error", errors: errors.map(e => e.errors[0]) } as DirectusError : { response: "Success", name: "Required Fields" };
};

const removeRequiredorIsNullable = (field:Field) => {
  if (field.meta?.required === true) {
    field.meta.required = false;
  }

  if (field.schema?.is_nullable === false) {
    // eslint-disable-next-line camelcase
    field.schema.is_nullable = true;
  }

  if (field.schema?.is_unique === true) {
    // eslint-disable-next-line camelcase
    field.schema.is_unique = false;
  }

  return field;
}

export default updateRequiredFields;