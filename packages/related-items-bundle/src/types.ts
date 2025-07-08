import type { Item, PrimaryKey, Relation } from '@directus/types';

export interface RelatedItem {
	collection: string;
	type: 'm2a' | 'a2m' | 'm2m' | 'm2o' | 'o2m';
	relation: Relation;
	field: string | null;
	junction_field: string | null;
	translations: Translations[] | null;
	fields: string[];
	primary_key: PrimaryKey;
	template?: string | null;
	junction_items: Item[];
	items: Item[];
}

export interface RelatedItemObject {
	primary_key?: PrimaryKey;
	collection: string;
	disabled: boolean;
	field: string | null;
	junction_field: string | null;
	junction_id: PrimaryKey | null;
	type: 'm2a' | 'a2m' | 'm2m' | 'm2o' | 'o2m';
	fields: string[];
	template?: string | null;
	item_id: PrimaryKey | null;
	data: Item;
}

export interface CollectionFilters {
	collection: string;
	name: string;
	item_count: number;
}

interface Translations {
	language: string;
	translation: string;
	singular: string;
	plural: string;
}
