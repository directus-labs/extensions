<script setup lang="ts">
import { computed } from 'vue';
import { seoRules } from '../../shared/rulesets';
import {
	calculateDensity,
	countOccurrences,
	countWords,
	normalizeContent,
	normalizeSlug,
} from '../../shared/utils';

const props = defineProps<{
	focusKeyphrase: string;
	title: string;
	description: string;
	slug: string | null | undefined;
	contentData: Record<string, unknown>;
	contentFieldNames: string[];
}>();

// Status types for analysis results
type AnalysisStatus = 'good' | 'warning' | 'error' | 'neutral';

// Title analysis
const titleAnalysis = computed(() => {
	if (!props.focusKeyphrase) {
		return { status: 'neutral' as AnalysisStatus, message: 'Add a focus keyphrase first' };
	}

	const titleLength = props.title?.length || 0;
	const hasKeyphrase = props.title?.toLowerCase().includes(props.focusKeyphrase.toLowerCase()) || false;
	const isTitleLengthGood = titleLength >= seoRules.title.minLength && titleLength <= seoRules.title.maxLength;

	if (!props.title) {
		return { status: 'error' as AnalysisStatus, message: 'Add a title' };
	}

	if (!hasKeyphrase) {
		return {
			status: 'warning' as AnalysisStatus,
			message: 'Your focus keyphrase is not in the SEO title',
			length: titleLength,
			hasKeyphrase,
			minLength: seoRules.title.minLength,
			maxLength: seoRules.title.maxLength,
		};
	}

	if (!isTitleLengthGood) {
		return titleLength < seoRules.title.minLength
			? {
					status: 'warning' as AnalysisStatus,
					message: `Title is too short (${titleLength} chars). The ideal length is between ${seoRules.title.minLength} and ${seoRules.title.maxLength} characters.`,
					length: titleLength,
					hasKeyphrase,
					minLength: seoRules.title.minLength,
					maxLength: seoRules.title.maxLength,
				}
			: {
					status: 'warning' as AnalysisStatus,
					message: `Title is too long (${titleLength} chars). The ideal length is between ${seoRules.title.minLength} and ${seoRules.title.maxLength} characters.`,
					length: titleLength,
					hasKeyphrase,
					minLength: seoRules.title.minLength,
					maxLength: seoRules.title.maxLength,
				};
	}

	return {
		status: 'good' as AnalysisStatus,
		message: 'Your SEO title contains the focus keyphrase and has a good length',
		length: titleLength,
		hasKeyphrase,
		minLength: seoRules.title.minLength,
		maxLength: seoRules.title.maxLength,
	};
});

// Description analysis
const descriptionAnalysis = computed(() => {
	if (!props.focusKeyphrase) {
		return { status: 'neutral' as AnalysisStatus, message: 'Add a focus keyphrase first' };
	}

	const descriptionLength = props.description?.length || 0;
	const hasKeyphrase = props.description?.toLowerCase().includes(props.focusKeyphrase.toLowerCase()) || false;
	const isDescriptionLengthGood = descriptionLength >= seoRules.meta_description.minLength
		&& descriptionLength <= seoRules.meta_description.maxLength;

	if (!props.description) {
		return { status: 'error' as AnalysisStatus, message: 'Add a meta description' };
	}

	if (!hasKeyphrase) {
		return {
			status: 'warning' as AnalysisStatus,
			message: 'Your focus keyphrase is not in the meta description',
			length: descriptionLength,
			hasKeyphrase,
			minLength: seoRules.meta_description.minLength,
			maxLength: seoRules.meta_description.maxLength,
		};
	}

	if (!isDescriptionLengthGood) {
		return descriptionLength < seoRules.meta_description.minLength
			? {
					status: 'warning' as AnalysisStatus,
					message: `Meta description is too short (${descriptionLength} chars). The ideal length is between ${seoRules.meta_description.minLength} and ${seoRules.meta_description.maxLength} characters.`,
					length: descriptionLength,
					hasKeyphrase,
					minLength: seoRules.meta_description.minLength,
					maxLength: seoRules.meta_description.maxLength,
				}
			: {
					status: 'warning' as AnalysisStatus,
					message: `Meta description is too long (${descriptionLength} chars). The ideal length is between ${seoRules.meta_description.minLength} and ${seoRules.meta_description.maxLength} characters.`,
					length: descriptionLength,
					hasKeyphrase,
					minLength: seoRules.meta_description.minLength,
					maxLength: seoRules.meta_description.maxLength,
				};
	}

	return {
		status: 'good' as AnalysisStatus,
		message: 'Your meta description contains the focus keyphrase and has a good length',
		length: descriptionLength,
		hasKeyphrase,
		minLength: seoRules.meta_description.minLength,
		maxLength: seoRules.meta_description.maxLength,
	};
});

// Slug analysis
const slugAnalysis = computed(() => {
	if (!props.focusKeyphrase) {
		return { status: 'neutral' as AnalysisStatus, message: 'Add a focus keyphrase first' };
	}

	if (!props.slug) {
		return { status: 'error' as AnalysisStatus, message: 'Add a slug' };
	}

	const normalizedSlug = normalizeSlug(props.slug);
	const normalizedKeyphrase = normalizeSlug(props.focusKeyphrase);

	const hasKeyphrase = normalizedSlug.includes(normalizedKeyphrase);

	if (!hasKeyphrase) {
		return {
			status: 'warning' as AnalysisStatus,
			message: 'Your focus keyphrase is not in the URL slug',
			hasKeyphrase,
		};
	}

	return {
		status: 'good' as AnalysisStatus,
		message: 'Your slug contains the focus keyphrase',
		hasKeyphrase,
	};
});

// Content analysis
const contentAnalysis = computed(() => {
	if (!props.focusKeyphrase) {
		return { status: 'neutral' as AnalysisStatus, message: 'Add a focus keyphrase first' };
	}

	// Combine content from all specified fields
	let combinedContent = '';

	if (props.contentFieldNames.length === 0 || !props.contentData) {
		return {
			status: 'error' as AnalysisStatus,
			message: 'No content fields are configured for analysis',
		};
	}

	for (const fieldName of props.contentFieldNames) {
		if (props.contentData[fieldName]) {
			combinedContent += ` ${props.contentData[fieldName]}`;
		}
	}

	if (!combinedContent.trim()) {
		return {
			status: 'error' as AnalysisStatus,
			message: 'Add some content to analyze',
		};
	}

	const cleanContent = normalizeContent(combinedContent);
	const wordCount = countWords(cleanContent);

	if (wordCount < 50) {
		return {
			status: 'warning' as AnalysisStatus,
			message: 'Your content is too short for a proper keyword density analysis',
			wordCount,
			density: 0,
			occurrences: 0,
			optimal: false,
		};
	}

	const keyphraseOccurrences = countOccurrences(cleanContent, props.focusKeyphrase);
	const density = calculateDensity(cleanContent, props.focusKeyphrase);
	const isOptimalDensity = density >= 0.5 && density <= 2;

	if (keyphraseOccurrences === 0) {
		return {
			status: 'error' as AnalysisStatus,
			message: 'Your focus keyphrase does not appear in the content',
			wordCount,
			density: 0,
			occurrences: 0,
			optimal: false,
		};
	}

	if (!isOptimalDensity) {
		return density < 0.5
			? {
					status: 'warning' as AnalysisStatus,
					message: `Keyword density (${density.toFixed(1)}%) is too low. The optimal density is between 0.5% and 2.0%.`,
					wordCount,
					density,
					occurrences: keyphraseOccurrences,
					optimal: false,
				}
			: {
					status: 'warning' as AnalysisStatus,
					message: `Keyword density (${density.toFixed(1)}%) is too high. The optimal density is between 0.5% and 2.0%.`,
					wordCount,
					density,
					occurrences: keyphraseOccurrences,
					optimal: false,
				};
	}

	return {
		status: 'good' as AnalysisStatus,
		message: `Your content has a good keyword density (${density.toFixed(1)}%)`,
		wordCount,
		density,
		occurrences: keyphraseOccurrences,
		optimal: true,
	};
});

// Get icon for status
function getStatusIcon(status: AnalysisStatus): string {
	switch (status) {
		case 'good':
			return 'check_circle';
		case 'warning':
			return 'warning';
		case 'error':
			return 'error';
		default:
			return 'info';
	}
}

// Get color for status
function getStatusColor(status: AnalysisStatus): string {
	switch (status) {
		case 'good':
			return 'var(--theme--primary)';
		case 'warning':
			return 'var(--theme--warning)';
		case 'error':
			return 'var(--theme--danger)';
		default:
			return 'var(--theme--foreground-subdued)';
	}
}
</script>

<template>
	<div class="keyphrase-analysis">
		<div class="keyphrase-analysis-title">
			Focus Keyphrase Analysis
		</div>

		<div v-if="!focusKeyphrase" class="empty-state">
			Enter a focus keyphrase to analyze your content
		</div>

		<template v-else>
			<div class="analysis-result" :class="titleAnalysis.status">
				<v-icon :name="getStatusIcon(titleAnalysis.status)" :style="{ color: getStatusColor(titleAnalysis.status) }" />
				<div class="analysis-text">
					<div class="analysis-title">
						SEO Title
					</div>
					<div class="analysis-message">
						{{ titleAnalysis.message }}
					</div>
					<div v-if="titleAnalysis.length !== undefined" class="analysis-details">
						Length: {{ titleAnalysis.length }} characters
						<span class="meter-wrapper">
							<span
								class="meter"
								:style="{
									width: `${Math.min(100, (titleAnalysis.length / titleAnalysis.maxLength) * 100)}%`,
									backgroundColor:
										titleAnalysis.length < titleAnalysis.minLength
										|| titleAnalysis.length > titleAnalysis.maxLength
											? 'var(--theme--warning)' : 'var(--theme--primary)',
								}"
							/>
						</span>
					</div>
				</div>
			</div>

			<div class="analysis-result" :class="descriptionAnalysis.status">
				<v-icon :name="getStatusIcon(descriptionAnalysis.status)" :style="{ color: getStatusColor(descriptionAnalysis.status) }" />
				<div class="analysis-text">
					<div class="analysis-title">
						Meta Description
					</div>
					<div class="analysis-message">
						{{ descriptionAnalysis.message }}
					</div>
					<div v-if="descriptionAnalysis.length !== undefined" class="analysis-details">
						Length: {{ descriptionAnalysis.length }} characters
						<span class="meter-wrapper">
							<span
								class="meter"
								:style="{
									width: `${Math.min(100, (descriptionAnalysis.length / descriptionAnalysis.maxLength) * 100)}%`,
									backgroundColor:
										descriptionAnalysis.length < descriptionAnalysis.minLength
										|| descriptionAnalysis.length > descriptionAnalysis.maxLength
											? 'var(--theme--warning)' : 'var(--theme--primary)',
								}"
							/>
						</span>
					</div>
				</div>
			</div>

			<div class="analysis-result" :class="slugAnalysis.status">
				<v-icon :name="getStatusIcon(slugAnalysis.status)" :style="{ color: getStatusColor(slugAnalysis.status) }" />
				<div class="analysis-text">
					<div class="analysis-title">
						URL Slug
					</div>
					<div class="analysis-message">
						{{ slugAnalysis.message }}
					</div>
				</div>
			</div>

			<div class="analysis-result" :class="contentAnalysis.status">
				<v-icon :name="getStatusIcon(contentAnalysis.status)" :style="{ color: getStatusColor(contentAnalysis.status) }" />
				<div class="analysis-text">
					<div class="analysis-title">
						Content
					</div>
					<div class="analysis-message">
						{{ contentAnalysis.message }}
					</div>
					<div v-if="contentAnalysis.wordCount" class="analysis-details">
						Word count: {{ contentAnalysis.wordCount }}<br>
						<template v-if="contentAnalysis.occurrences > 0">
							Occurrences: {{ contentAnalysis.occurrences }} times<br>
							Density: {{ contentAnalysis.density.toFixed(1) }}%
							<span class="meter-wrapper">
								<span
									class="meter"
									:style="{
										width: `${Math.min(100, contentAnalysis.density * 50)}%`,
										backgroundColor: contentAnalysis.optimal
											? 'var(--theme--primary)' : 'var(--theme--warning)',
									}"
								/>
							</span>
						</template>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<style scoped>
.keyphrase-analysis {
	margin-bottom: 24px;
	border: 2px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 1.5rem;
}

.keyphrase-analysis-title {
	font-weight: bold;
	margin-bottom: 12px;
	color: var(--theme--foreground);
}

.empty-state {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	padding: 12px 0;
}

.analysis-result {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 12px 0;
	border-bottom: 1px solid var(--theme--border);
}

.analysis-result:last-child {
	border-bottom: none;
}

.analysis-text {
	flex: 1;
}

.analysis-title {
	font-weight: bold;
	margin-bottom: 4px;
	color: var(--theme--foreground);
}

.analysis-message {
	margin-bottom: 4px;
}

.analysis-details {
	font-size: 0.85em;
	color: var(--theme--foreground-subdued);
}

.meter-wrapper {
	display: inline-block;
	width: 100px;
	height: 4px;
	background-color: var(--theme--background);
	border-radius: 2px;
	margin-left: 8px;
	overflow: hidden;
}

.meter {
	display: block;
	height: 100%;
	border-radius: 2px;
}
</style>
