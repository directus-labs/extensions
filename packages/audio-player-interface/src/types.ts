export type AudioService = 'external' | 'directus';
export type AudioSource = string;
export type Audio =
	| { service: AudioService; source: AudioSource }
	| null
	| undefined;
