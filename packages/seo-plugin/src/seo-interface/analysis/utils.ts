import type { AnalysisResult } from './types';
import { seoRules } from '../../shared/rulesets';
import {
	calculateDensity,
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
			title: 'SEO Title',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	const titleLength = input.title?.length || 0;
	const hasKeyphrase = input.title?.toLowerCase().includes(input.focusKeyphrase.toLowerCase()) || false;
	const isTitleLengthGood = titleLength >= seoRules.title.minLength && titleLength <= seoRules.title.maxLength;

	if (!input.title) {
		return {
			id: 'title',
			title: 'SEO Title',
			status: 'error',
			message: 'Add a title',
		};
	}

	if (!hasKeyphrase) {
		return {
			id: 'title',
			title: 'SEO Title',
			status: 'warning',
			message: 'Your focus keyphrase is not in the SEO title',
			details: {
				length: titleLength,
				hasKeyphrase,
				minLength: seoRules.title.minLength,
				maxLength: seoRules.title.maxLength,
			},
		};
	}

	if (!isTitleLengthGood) {
		const message = titleLength < seoRules.title.minLength
			? `Title is too short (${titleLength} chars). Ideal: ${seoRules.title.minLength}-${seoRules.title.maxLength} characters.`
			: `Title is too long (${titleLength} chars). Ideal: ${seoRules.title.minLength}-${seoRules.title.maxLength} characters.`;
		return {
			id: 'title',
			title: 'SEO Title',
			status: 'warning',
			message,
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
		title: 'SEO Title',
		status: 'good',
		message: 'Your SEO title contains the focus keyphrase and has a good length',
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
			title: 'Meta Description',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	const descriptionLength = input.description?.length || 0;
	const hasKeyphrase = input.description?.toLowerCase().includes(input.focusKeyphrase.toLowerCase()) || false;
	const isDescriptionLengthGood = descriptionLength >= seoRules.meta_description.minLength
		&& descriptionLength <= seoRules.meta_description.maxLength;

	if (!input.description) {
		return {
			id: 'description',
			title: 'Meta Description',
			status: 'error',
			message: 'Add a meta description',
		};
	}

	if (!hasKeyphrase) {
		return {
			id: 'description',
			title: 'Meta Description',
			status: 'warning',
			message: 'Your focus keyphrase is not in the meta description',
			details: {
				length: descriptionLength,
				hasKeyphrase,
				minLength: seoRules.meta_description.minLength,
				maxLength: seoRules.meta_description.maxLength,
			},
		};
	}

	if (!isDescriptionLengthGood) {
		const message = descriptionLength < seoRules.meta_description.minLength
			? `Meta description is too short (${descriptionLength} chars). Ideal: ${seoRules.meta_description.minLength}-${seoRules.meta_description.maxLength} characters.`
			: `Meta description is too long (${descriptionLength} chars). Ideal: ${seoRules.meta_description.minLength}-${seoRules.meta_description.maxLength} characters.`;
		return {
			id: 'description',
			title: 'Meta Description',
			status: 'warning',
			message,
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
		title: 'Meta Description',
		status: 'good',
		message: 'Your meta description contains the focus keyphrase and has a good length',
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
			title: 'URL Slug',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	if (!input.slug) {
		return {
			id: 'slug',
			title: 'URL Slug',
			status: 'error',
			message: 'Add a slug',
		};
	}

	const normalizedSlug = normalizeSlug(input.slug);
	const normalizedKeyphrase = normalizeSlug(input.focusKeyphrase);
	const hasKeyphrase = normalizedSlug.includes(normalizedKeyphrase);

	if (!hasKeyphrase) {
		return {
			id: 'slug',
			title: 'URL Slug',
			status: 'warning',
			message: 'Your focus keyphrase is not in the URL slug',
			details: { hasKeyphrase },
		};
	}

	return {
		id: 'slug',
		title: 'URL Slug',
		status: 'good',
		message: 'Your slug contains the focus keyphrase',
		details: { hasKeyphrase },
	};
}

export function analyzeContent(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'content',
			title: 'Content',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'content',
			title: 'Content',
			status: 'neutral',
			message: 'No content provided for analysis',
		};
	}

	const cleanContent = normalizeContent(input.combinedContent);
	const wordCount = countWords(cleanContent);

	if (wordCount < 50) {
		return {
			id: 'content',
			title: 'Content',
			status: 'warning',
			message: 'Your content is too short for a proper keyword density analysis',
			details: { wordCount, density: 0, occurrences: 0, optimal: false },
		};
	}

	const keyphraseOccurrences = countOccurrences(cleanContent, input.focusKeyphrase);
	const density = calculateDensity(cleanContent, input.focusKeyphrase);
	const isOptimalDensity = density >= 0.5 && density <= 2;

	if (keyphraseOccurrences === 0) {
		return {
			id: 'content',
			title: 'Content',
			status: 'error',
			message: 'Your focus keyphrase does not appear in the content',
			details: { wordCount, density: 0, occurrences: 0, optimal: false },
		};
	}

	if (!isOptimalDensity) {
		const message = density < 0.5
			? `Keyword density (${density.toFixed(1)}%) is too low. Optimal: 0.5%-2.0%.`
			: `Keyword density (${density.toFixed(1)}%) is too high. Optimal: 0.5%-2.0%.`;
		return {
			id: 'content',
			title: 'Content',
			status: 'warning',
			message,
			details: { wordCount, density, occurrences: keyphraseOccurrences, optimal: false },
		};
	}

	return {
		id: 'content',
		title: 'Content',
		status: 'good',
		message: `Your content has a good keyword density (${density.toFixed(1)}%)`,
		details: { wordCount, density, occurrences: keyphraseOccurrences, optimal: true },
	};
}

export function analyzeImageAltText(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'No content to analyze for images',
		};
	}

	const altTexts = extractImageAltText(input.combinedContent);

	if (altTexts.length === 0) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'No images found in the content',
			details: { imageCount: 0, altTexts: [] },
		};
	}

	const keyphraseInAlt = altTexts.some((alt) =>
		alt.toLowerCase().includes(input.focusKeyphrase.toLowerCase()),
	);

	if (!keyphraseInAlt) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'warning',
			message: 'None of your images have alt attributes containing your focus keyphrase',
			details: { imageCount: altTexts.length, altTexts },
		};
	}

	return {
		id: 'image_alt',
		title: 'Image Alt Text',
		status: 'good',
		message: 'At least one image has an alt attribute with the focus keyphrase',
		details: { imageCount: altTexts.length, altTexts },
	};
}

export function analyzeSubheadings(input: AnalysisInput): AnalysisResult {
	if (!input.focusKeyphrase) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	if (!input.combinedContent) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'neutral',
			message: 'No content to analyze for subheadings',
		};
	}

	const subheadings = extractSubheadings(input.combinedContent);

	if (subheadings.length === 0) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'warning',
			message: 'No subheadings found in the content',
			details: { subheadingCount: 0, subheadings: [] },
		};
	}

	const keyphraseInSubheadings = subheadings.some((heading) =>
		heading.toLowerCase().includes(input.focusKeyphrase.toLowerCase()),
	);

	if (!keyphraseInSubheadings) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'warning',
			message: 'Your subheadings don\'t contain the focus keyphrase',
			details: { subheadingCount: subheadings.length, subheadings },
		};
	}

	return {
		id: 'subheadings',
		title: 'Subheadings',
		status: 'good',
		message: 'Your focus keyphrase appears in at least one subheading',
		details: { subheadingCount: subheadings.length, subheadings },
	};
}
