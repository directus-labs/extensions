export enum Source {
	request = 'Web Request',
	list = 'List',
};

export type Step = {
	text: string;
	value: string | Record<string, any> | null;
};

export type Value = {
	steps: (Step | null)[];
	payload?: string | Record<string, any> | null;
};

export type Scope = {
	steps?: (Step | null)[];
	values?: (string | Record<string, any> | null)[];
};
