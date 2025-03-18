import type { Field, FieldMeta } from '@directus/types';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type DynamicFieldMeta = PartialExcept<FieldMeta, 'interface'>;

export type ElasticSearchOptions = {
  platform: 'cloud' | 'selfhosted';
  host: string;
  api_key: string;
  action: 'create' | 'read' | 'update' | 'delete';
  search_index: string;
  document_id: string | string[] | number[];
  document?: ElasticSearchObject;
};

type ElasticSearchObject = {
  [key: string]: unknown;
}

export type DynamicField = {
  field: string;
  name?: string;
  type?: string;
  meta: DynamicFieldMeta;
} & Partial<Omit<Field, 'meta'>>;