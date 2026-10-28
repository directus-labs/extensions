export type AnalysisStatus = 'good' | 'warning' | 'error' | 'neutral';

export interface AnalysisResultDetails {
	length?: number;
	hasKeyphrase?: boolean;
	minLength?: number;
	maxLength?: number;
	wordCount?: number;
	density?: number;
	occurrences?: number;
	optimal?: boolean;
	imageCount?: number;
	altTexts?: string[];
	subheadingCount?: number;
	subheadings?: string[];
}

export interface AnalysisResult {
	id: string;
	/** i18n key */
	title: string;
	status: AnalysisStatus;
	/** i18n key */
	message: string;
	messageParams?: Record<string, unknown>;
	details?: AnalysisResultDetails;
}
