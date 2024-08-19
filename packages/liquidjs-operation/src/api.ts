/// <reference types="@directus/extensions/api.d.ts" />
import { defineOperationApi } from '@directus/extensions-sdk';
// @ts-ignore - Using the browser.esm version in order to make this 'sandboxable'.
import { Liquid } from 'liquidjs/dist/liquid.browser.esm';
import { request } from 'directus:api';

export interface Options {
  mode: 'custom' | 'saved';
  operationMode: 'single' | 'batch';
  template?: string;
  collection?: string;
  item?: { key: string };
  fields: string[];
  data: Record<string, any> | Record<string, any>[];
  accessToken?: string;
  publicUrl: string;
  identifierField?: string;
  dataReturnFields?: string[]
}

interface RenderedField {
  [field: string]: string;
}

const engine = new Liquid({
  outputDelimiterLeft: '{#',
  outputDelimiterRight: '#}',
  greedy: true,
});

async function renderTemplate(
  data: Record<string, any>,
  template: Record<string, string>,
  fields: string[]
): Promise<RenderedField> {
  const renderedFields = await Promise.all(fields.map(async (field) => ({
    [field]: await engine.parseAndRender(template[field], data)
  })));
  return Object.assign({}, ...renderedFields);
}

async function fetchSavedTemplate(
  collection: string,
  itemKey: string,
  publicUrl: string,
  accessToken?: string
): Promise<Record<string, string>> {
  const response = await request(`${publicUrl}items/${collection}/${itemKey}`, {
    method: 'GET',
    ...(accessToken && {
      headers: { Authorization: `Bearer ${accessToken}` }
    }),
  });
  const responseData = response.data as Record<string, unknown>;
  return responseData.data as Record<string, string>;
}

export default defineOperationApi<Options>({
	id: 'liquidjs-operation',
	handler: async ({ mode, operationMode, template, collection, item, fields, data, accessToken, publicUrl, dataReturnFields }) => {
	  try {
		let templateToRender: Record<string, string>;
		// CORS fix for local dev
		if (publicUrl.includes('localhost')) {
		  publicUrl = publicUrl.replace('localhost', '0.0.0.0');
		}

		// Template Mode
		switch (mode) {
		  case 'saved':
			if (!collection || !item) {
			  throw new Error('Collection and item are required for saved template mode');
			}
			templateToRender = await fetchSavedTemplate(collection, item.key, publicUrl, accessToken);
			break;
		  case 'custom':
			if (!template) {
			  throw new Error('Template is required for custom mode');
			}
			templateToRender = { template };
			fields = ['template'];
			break;
		  default:
			throw new Error('Invalid mode specified');
		}

		const returnFields = (item: Record<string, any>) =>
		  dataReturnFields ? Object.fromEntries(dataReturnFields.map(field => [field, item[field]])) : {};

		// Operation Mode
		switch (operationMode) {
		  case 'single':
			if (Array.isArray(data)) {
			  throw new Error('Single operation mode expects a single data object, not an array');
			}
			const rendered = await renderTemplate(data, templateToRender, fields);
			return { ...returnFields(data), ...rendered };
		  case 'batch':
			if (!Array.isArray(data)) {
			  throw new Error('Batch operation mode expects an array of data objects');
			}
			return Promise.all(data.map(async (item) => {
			  const rendered = await renderTemplate(item, templateToRender, fields);
			  return { ...returnFields(item), ...rendered };
			}));
		  default:
			throw new Error('Invalid operation mode specified');
		}
	  } catch (error) {
		throw new Error((error as Error).message || 'An unknown error occurred');
	  }
	},
  });
