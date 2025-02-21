export interface SeoRule {
	field: string;
	minLength: number;
	maxLength: number;
}

export type SeoRuleKey = 'title' | 'meta_description';

export const seoRules: Record<SeoRuleKey, SeoRule> = {
	title: {
		field: 'title',
		minLength: 45,
		maxLength: 60,
	},
	meta_description: {
		field: 'meta_description',
		minLength: 130,
		maxLength: 160,
	},
};
