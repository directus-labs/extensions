import type { Field, FieldMeta } from '@directus/types';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type DynamicFieldMeta = PartialExcept<FieldMeta, 'interface'>;

interface HubSpotProperties {
	[key: string]: any;
}

export type DynamicField = {
	field: string;
	name?: string;
	type?: string;
	meta: DynamicFieldMeta;
} & Partial<Omit<Field, 'meta'>>;

export interface HubSpotOptions {
	apiKey: string;
	endpoint: string;
	action: string;
	[key: string]: any;
}

export interface HubSpotSchema {
	associations: Array<Record<string, any>>;
	properties: Record<string, HubSpotProperties>;
}
