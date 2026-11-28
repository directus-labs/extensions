export interface Prompt {
	text: string;
	value: string;
	icon: string;
	messages: message[];
}

export interface message {
	role: string;
	content: string;
}

export type RequestBody = Record<string, any>;
