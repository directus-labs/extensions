import { defineEndpoint } from '@directus/extensions-sdk';
import { InvalidPayloadError, ForbiddenError, UnexpectedResponseError } from '@directus/errors';
import type { Request } from 'express';
import axios from 'axios';
import type { Header } from '../api-metric-panel/panel.vue';
import type { Accountability } from '@directus/types'; 

interface DirectusRequest extends Request {
	accountability?: Accountability;
}


export default defineEndpoint((router) => {
	router.get('/', async (req: DirectusRequest, res, next) => {
		
		if(!req.accountability?.app) {
			return next(new ForbiddenError());
		}

		if (!req.query || !req.query.requestUrl) {
			return next(new InvalidPayloadError({ reason: 'Missing requestUrl parameters' }));
		}


		try {
			const headerArray: Header[] = JSON.parse(req.query.requestHeaders as string || '[]');
		
			const parsedHeaders = headerArray.reduce<Record<string, string>>((acc, { header, value }) => {
				if (header && value) {
					acc[header] = value;
				}
				return acc;
			}, {});
				
			const response = await axios(req.query.requestUrl as string, {
				method: req.query.requestMethod as string | undefined || 'GET',
				headers: parsedHeaders,
				data: req.query.requestBody ?? null,
			});

			res.send({
				status: 200,
				body: {
					data: getNestedValue(response.data, req.query.resultsPath as string | undefined)
				},
			});
		} catch (error) {
			return next(new UnexpectedResponseError());
		}
	});
});


function getNestedValue(data: Record<string, any> | string, stringPath = null as string | null): any {
	if (!stringPath) {
		return data;
	}

	const path = stringPath.split('.');
	let metric = data;

  for (const key of path) {
    if (metric && typeof metric === 'object' && key in metric) {
      metric = metric[key];
		} else {
      return undefined;
		}
	}

  return metric;
}
