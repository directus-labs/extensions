import type { Field, FieldMeta } from '@directus/types';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type DynamicFieldMeta = PartialExcept<FieldMeta, 'interface'>;

export interface OpenSearchOptions {
	platform: 'cloud' | 'selfhosted';
	host: string;
	force_ssl: boolean;
	username: string;
	password: string;
	action: 'create' | 'read' | 'update' | 'delete';
	search_index: string;
	document_id: string | string[] | number[];
	document?: OpenSearchObject;
}

export interface OpenSearchObject {
	[key: string]: unknown;
}

export type DynamicField = {
	field: string;
	name?: string;
	type?: string;
	meta: DynamicFieldMeta;
} & Partial<Omit<Field, 'meta'>>;
