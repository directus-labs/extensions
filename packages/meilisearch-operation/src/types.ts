export interface MeiliSearchOptions {
	host: string;
	api_key: string;
	action: 'create' | 'read' | 'update' | 'delete';
	search_index: string;
	document_id: string | string[] | number[];
	document?: MeiliSearchObject;
}

export interface MeiliSearchObject {
	[key: string]: unknown;
}

export interface Schema {
	create: any;
	read: any;
	update: any;
	delete?: any;
}
