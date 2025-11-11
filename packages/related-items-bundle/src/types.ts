import type { Item, PrimaryKey, Relation } from '@directus/types';

export interface RelatedItem {
	primary_key: PrimaryKey;
	collection: string;
	type: 'm2a' | 'a2m' | 'm2m' | 'm2o' | 'o2m';
	relation: Relation;
	field: string | null;
	junction_field: string | null;
	junction_items: Item[];
	translations: Translations[] | null;
	fields: string[];
	template?: string | null;
	items: Item[];
}

export interface RelatedItemObject {
	primary_key?: PrimaryKey;
	collection: string;
	type: 'm2a' | 'a2m' | 'm2m' | 'm2o' | 'o2m';
	relation: Relation;
	disabled: boolean;
	field: string | null;
	junction_field: string | null;
	junction_id: PrimaryKey | null;
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
