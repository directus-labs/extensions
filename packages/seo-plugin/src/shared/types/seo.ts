export interface SeoFieldRule {
	minLength: number;
	maxLength: number;
}

export type SeoFieldStatus = 'missing' | 'too-short' | 'too-long' | 'ideal';

export interface SeoFieldState {
	length: number;
	progress: number;
	status: SeoFieldStatus;
	message: string;
}

export interface SeoValue {
	title: string;
	meta_description: string;
	// translations?: {
	// 	language: string;
	// 	title: string;
	// 	meta_description: string;
	// }[];
	og_image?: string;
	additional_fields?: Record<string, string>;
	sitemap?: {
		change_frequency: string;
		priority: string;
	};
	no_index?: boolean;
	no_follow?: boolean;
}

export interface SeoInterfaceOptions {
	titleTemplate?: string;
	descriptionTemplate?: string;
	showOgImage?: boolean;
	showNoIndex?: boolean;
	showSitemap?: boolean;
	defaultChangeFrequency?: string;
	defaultPriority?: string;
	additionalFields?: any[];
}
