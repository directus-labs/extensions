export interface RelatedItem {
	collection: string;
	relation: 'm2a' | 'm2m' | 'm2o' | 'o2m';
	field?: string | null;
	translations: Translations[] | null;
	fields: string[];
	junction_field?: string | null;
	primary_key: string;
	template?: string | null;
	items: Record<string, any>;
}

export interface RelatedItemObject {
	collection: string;
	disabled: boolean;
	field?: string | null;
	relation: 'm2a' | 'm2m' | 'm2o' | 'o2m';
	fields: string[];
	template?: string | null;
	item_id: string;
	data: Record<string, any>;
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
