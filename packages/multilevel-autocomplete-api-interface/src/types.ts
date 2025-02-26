export enum Source {
	request = 'Web Request',
	list = 'List',
}

;

export interface Step {
	text: string;
	value: string | Record<string, any> | null;
}

export interface Value {
	steps: (Step | null)[];
	payload?: string | Record<string, any> | null;
}

export interface Scope {
	steps?: (Step | null)[];
	values?: (string | Record<string, any> | null)[];
}
