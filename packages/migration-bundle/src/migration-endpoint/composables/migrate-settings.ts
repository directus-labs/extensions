
import type { RestClient } from '@directus/sdk';
import type { DirectusError } from '../../types/extension';
import type { Settings } from '@directus/types';
import { createDefu } from 'defu';
import { readSettings, updateSettings, DirectusSettings } from '@directus/sdk';
import { Schema } from '../api';

// @ts-ignore
const customDefu = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    // @ts-expect-error
    obj[key] = mergeArrays(key, obj[key], value);
    return true;
  }

  if (typeof obj[key] === 'string' && typeof value === 'string') {
    // @ts-expect-error
    obj[key] = mergeJsonStrings(obj[key], value);
    return true;
  }
})

function mergeArrays(key: string, current: any[], incoming: any[]): any[] {
  const mergeKeys = {
    /* eslint-disable camelcase */
    basemaps: ['key'],
    custom_aspect_ratios: ['key'],
    module_bar: ['id', 'type'],
    storage_asset_presets: ['key'],
    /* eslint-enable camelcase */
  };

  const keys = mergeKeys[key as keyof typeof mergeKeys];
  if (!keys) return [...new Set([...current, ...incoming])];

  return current.concat(
    incoming.filter(item => !current.some(
      currentItem => keys.every(k => currentItem[k] === item[k]),
    )),
  );
}

function mergeJsonStrings(current: string, incoming: string): string {
  try {
    return JSON.stringify(customDefu(JSON.parse(current), JSON.parse(incoming)));
  } catch {
    return incoming; // If not valid JSON, return the incoming value
  }
}

const migrateSettings = async ({ res, client, settings, dry_run = false }: { res: any, client: RestClient<Schema>, settings: Settings | {}, dry_run: boolean }): Promise<{ response: string, name: string } | DirectusError> => {
  res.write(`* [Local] Loading Settings\r\n\r\n`);
  try {
    const currentSettings = await client.request(readSettings());
    const mergedSettings = customDefu(currentSettings, settings) as DirectusSettings;
    if(!dry_run){
      await client.request(updateSettings(mergedSettings));
    }

    res.write("* Settings Migration Complete\r\n\r\n");
    return { response: "Success", name: "Settings" };

  } catch (error) {
    console.error(error);
    let errorResponse = error as DirectusError;
    res.write("error\r\n\r\n");
    if(errorResponse.errors && errorResponse.errors.length > 0){
      res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
    }
    return errorResponse;
  }
};

export default migrateSettings;