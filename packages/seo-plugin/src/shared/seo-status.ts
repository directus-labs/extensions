import type { SeoInterfaceOptions, SeoValue } from './types/seo';
import { seoRules } from './rulesets';
import { isEmptyValue } from './utils';

export type SeoStatusColor = 'neutral' | 'success' | 'warning' | 'error';

export interface SeoStatus {
	icon: string;
	color: SeoStatusColor;
}

const SEVERITY: Record<SeoStatusColor, number> = { neutral: 0, success: 1, warning: 2, error: 3 };

function isIdealLength(text: string, rule: { minLength: number; maxLength: number }) {
	return text.length >= rule.minLength && text.length <= rule.maxLength;
}

export function countMissingRequiredFields(value: SeoValue, options: SeoInterfaceOptions | null | undefined): number {
	return (options?.additionalFields ?? []).filter(
		(field) => field?.required && isEmptyValue(value.additional_fields?.[String(field.field)]),
	).length;
}

/**
 * The overall status shown on the display chip
 */
export function getSeoStatus(value: SeoValue, options: SeoInterfaceOptions | null | undefined): SeoStatus {
	if (value.no_index) return { icon: 'visibility_off', color: 'neutral' };
	if (!value.title || !value.meta_description) return { icon: 'error', color: 'error' };
	if (countMissingRequiredFields(value, options) > 0) return { icon: 'error', color: 'error' };

	if (!isIdealLength(value.title, seoRules.title) || !isIdealLength(value.meta_description, seoRules.meta_description)) {
		return { icon: 'warning', color: 'warning' };
	}

	if (options?.showOgImage && !value.og_image) return { icon: 'warning', color: 'warning' };

	return { icon: 'check', color: 'success' };
}

export function worstSeoStatus(statuses: SeoStatus[]): SeoStatus {
	return statuses.reduce((worst, status) => (SEVERITY[status.color] > SEVERITY[worst.color] ? status : worst));
}
