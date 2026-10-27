import type { AnalysisResult } from './types';
import { seoRules } from '../../shared/rulesets';
import {
	calculateDensity,
	containsPhrase,
	countOccurrences,
	countWords,
	extractImageAltText,
	extractSubheadings,
	normalizeContent,
	normalizeSlug,
} from '../../shared/utils';

interface AnalysisInput {
	focusKeyphrase: string;
	title?: string;
	description?: string;
	slug?: string | null;
	combinedContent?: string;
}

export function analyzeTitle(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'title',
			title: 'seo_plugin.analysis.titles.title',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	const titleLength = input.title?.length || 0;
	const hasKeyphrase = containsPhrase(input.title, input.focusKeyphrase);
	const isTitleLengthGood = titleLength >= seoRules.title.minLength && titleLength <= seoRules.title.maxLength;

	if (!input.title) {
		return {
			id: 'title',
			title: 'seo_plugin.analysis.titles.title',
			status: 'error',
			message: 'seo_plugin.analysis.messages.add_title',
		};
	}

	if (!hasKeyphrase) {
		return {
			id: 'title',
			title: 'seo_plugin.analysis.titles.title',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.title_missing_keyphrase',
			details: {
				length: titleLength,
				hasKeyphrase,
				minLength: seoRules.title.minLength,
				maxLength: seoRules.title.maxLength,
			},
		};
	}

	if (!isTitleLengthGood) {
		return {
			id: 'title',
			title: 'seo_plugin.analysis.titles.title',
			status: 'warning',
			message: titleLength < seoRules.title.minLength ? 'seo_plugin.analysis.messages.title_too_short' : 'seo_plugin.analysis.messages.title_too_long',
			messageParams: { length: titleLength, min: seoRules.title.minLength, max: seoRules.title.maxLength },
			details: {
				length: titleLength,
				hasKeyphrase,
				minLength: seoRules.title.minLength,
				maxLength: seoRules.title.maxLength,
			},
		};
	}

	return {
		id: 'title',
		title: 'seo_plugin.analysis.titles.title',
		status: 'good',
		message: 'seo_plugin.analysis.messages.title_good',
		details: {
			length: titleLength,
			hasKeyphrase,
			minLength: seoRules.title.minLength,
			maxLength: seoRules.title.maxLength,
		},
	};
}

export function analyzeDescription(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'description',
			title: 'seo_plugin.analysis.titles.description',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	const descriptionLength = input.description?.length || 0;
	const hasKeyphrase = containsPhrase(input.description, input.focusKeyphrase);
	const isDescriptionLengthGood = descriptionLength >= seoRules.meta_description.minLength
		&& descriptionLength <= seoRules.meta_description.maxLength;

	if (!input.description) {
		return {
			id: 'description',
			title: 'seo_plugin.analysis.titles.description',
			status: 'error',
			message: 'seo_plugin.analysis.messages.add_description',
		};
	}

	if (!hasKeyphrase) {
		return {
			id: 'description',
			title: 'seo_plugin.analysis.titles.description',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.description_missing_keyphrase',
			details: {
				length: descriptionLength,
				hasKeyphrase,
				minLength: seoRules.meta_description.minLength,
				maxLength: seoRules.meta_description.maxLength,
			},
		};
	}

	if (!isDescriptionLengthGood) {
		return {
			id: 'description',
			title: 'seo_plugin.analysis.titles.description',
			status: 'warning',
			message: descriptionLength < seoRules.meta_description.minLength ? 'seo_plugin.analysis.messages.description_too_short' : 'seo_plugin.analysis.messages.description_too_long',
			messageParams: { length: descriptionLength, min: seoRules.meta_description.minLength, max: seoRules.meta_description.maxLength },
			details: {
				length: descriptionLength,
				hasKeyphrase,
				minLength: seoRules.meta_description.minLength,
				maxLength: seoRules.meta_description.maxLength,
			},
		};
	}

	return {
		id: 'description',
		title: 'seo_plugin.analysis.titles.description',
		status: 'good',
		message: 'seo_plugin.analysis.messages.description_good',
		details: {
			length: descriptionLength,
			hasKeyphrase,
			minLength: seoRules.meta_description.minLength,
			maxLength: seoRules.meta_description.maxLength,
		},
	};
}

export function analyzeSlug(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'slug',
			title: 'seo_plugin.analysis.titles.slug',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	if (!input.slug) {
		return {
			id: 'slug',
			title: 'seo_plugin.analysis.titles.slug',
			status: 'error',
			message: 'seo_plugin.analysis.messages.add_slug',
		};
	}

	const normalizedSlug = normalizeSlug(input.slug);
	const normalizedKeyphrase = normalizeSlug(input.focusKeyphrase);
	const hasKeyphrase = normalizedKeyphrase !== '' && normalizedSlug.includes(normalizedKeyphrase);

	if (!hasKeyphrase) {
		return {
			id: 'slug',
			title: 'seo_plugin.analysis.titles.slug',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.slug_missing_keyphrase',
			details: { hasKeyphrase },
		};
	}

	return {
		id: 'slug',
		title: 'seo_plugin.analysis.titles.slug',
		status: 'good',
		message: 'seo_plugin.analysis.messages.slug_good',
		details: { hasKeyphrase },
	};
}

export function analyzeContent(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'content',
			title: 'seo_plugin.analysis.titles.content',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'content',
			title: 'seo_plugin.analysis.titles.content',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.no_content',
		};
	}

	const cleanContent = normalizeContent(input.combinedContent);
	const wordCount = countWords(cleanContent);

	if (wordCount < 50) {
		return {
			id: 'content',
			title: 'seo_plugin.analysis.titles.content',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.content_too_short',
			details: { wordCount, density: 0, occurrences: 0, optimal: false },
		};
	}

	const keyphraseOccurrences = countOccurrences(cleanContent, input.focusKeyphrase);
	const density = calculateDensity(cleanContent, input.focusKeyphrase);
	const isOptimalDensity = density >= 0.5 && density <= 2;

	if (keyphraseOccurrences === 0) {
		return {
			id: 'content',
			title: 'seo_plugin.analysis.titles.content',
			status: 'error',
			message: 'seo_plugin.analysis.messages.content_missing_keyphrase',
			details: { wordCount, density: 0, occurrences: 0, optimal: false },
		};
	}

	if (!isOptimalDensity) {
		return {
			id: 'content',
			title: 'seo_plugin.analysis.titles.content',
			status: 'warning',
			message: density < 0.5 ? 'seo_plugin.analysis.messages.density_too_low' : 'seo_plugin.analysis.messages.density_too_high',
			messageParams: { density: density.toFixed(1) },
			details: { wordCount, density, occurrences: keyphraseOccurrences, optimal: false },
		};
	}

	return {
		id: 'content',
		title: 'seo_plugin.analysis.titles.content',
		status: 'good',
		message: 'seo_plugin.analysis.messages.density_good',
		messageParams: { density: density.toFixed(1) },
		details: { wordCount, density, occurrences: keyphraseOccurrences, optimal: true },
	};
}

export function analyzeImageAltText(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'image_alt',
			title: 'seo_plugin.analysis.titles.image_alt',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'image_alt',
			title: 'seo_plugin.analysis.titles.image_alt',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.no_content_images',
		};
	}

	const altTexts = extractImageAltText(input.combinedContent);

	if (altTexts.length === 0) {
		return {
			id: 'image_alt',
			title: 'seo_plugin.analysis.titles.image_alt',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.no_images',
			details: { imageCount: 0, altTexts: [] },
		};
	}

	const keyphraseInAlt = altTexts.some((alt) => containsPhrase(alt, input.focusKeyphrase));

	if (!keyphraseInAlt) {
		return {
			id: 'image_alt',
			title: 'seo_plugin.analysis.titles.image_alt',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.alt_missing_keyphrase',
			details: { imageCount: altTexts.length, altTexts },
		};
	}

	return {
		id: 'image_alt',
		title: 'seo_plugin.analysis.titles.image_alt',
		status: 'good',
		message: 'seo_plugin.analysis.messages.alt_good',
		details: { imageCount: altTexts.length, altTexts },
	};
}

export function analyzeSubheadings(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'subheadings',
			title: 'seo_plugin.analysis.titles.subheadings',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.add_keyphrase_first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'subheadings',
			title: 'seo_plugin.analysis.titles.subheadings',
			status: 'neutral',
			message: 'seo_plugin.analysis.messages.no_content_subheadings',
		};
	}

	const subheadings = extractSubheadings(input.combinedContent);

	if (subheadings.length === 0) {
		return {
			id: 'subheadings',
			title: 'seo_plugin.analysis.titles.subheadings',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.no_subheadings',
			details: { subheadingCount: 0, subheadings: [] },
		};
	}

	const keyphraseInSubheadings = subheadings.some((heading) => containsPhrase(heading, input.focusKeyphrase));

	if (!keyphraseInSubheadings) {
		return {
			id: 'subheadings',
			title: 'seo_plugin.analysis.titles.subheadings',
			status: 'warning',
			message: 'seo_plugin.analysis.messages.subheadings_missing_keyphrase',
			details: { subheadingCount: subheadings.length, subheadings },
		};
	}

	return {
		id: 'subheadings',
		title: 'seo_plugin.analysis.titles.subheadings',
		status: 'good',
		message: 'seo_plugin.analysis.messages.subheadings_good',
		details: { subheadingCount: subheadings.length, subheadings },
	};
}
