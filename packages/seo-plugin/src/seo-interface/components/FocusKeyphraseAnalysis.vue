<script setup lang="ts">
import { computed, ref } from 'vue';
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

interface AnalysisResult {
	id: string;
	title: string;
	status: AnalysisStatus;
	message: string;
	details?: {
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
	};
}

// Track which sections are expanded
const expandedSections = ref({
	problems: true,
	improvements: true,
	goodResults: false,
});

// Title analysis
const titleAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'title',
			title: 'SEO Title',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	const titleLength = props.title?.length || 0;
	const hasKeyphrase = props.title?.toLowerCase().includes(props.focusKeyphrase.toLowerCase()) || false;
	const isTitleLengthGood = titleLength >= seoRules.title.minLength && titleLength <= seoRules.title.maxLength;

	if (!props.title) {
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
		return titleLength < seoRules.title.minLength
			? {
					id: 'title',
					title: 'SEO Title',
					status: 'warning',
					message: `Title is too short (${titleLength} chars). The ideal length is between ${seoRules.title.minLength} and ${seoRules.title.maxLength} characters.`,
					details: {
						length: titleLength,
						hasKeyphrase,
						minLength: seoRules.title.minLength,
						maxLength: seoRules.title.maxLength,
					},
				}
			: {
					id: 'title',
					title: 'SEO Title',
					status: 'warning',
					message: `Title is too long (${titleLength} chars). The ideal length is between ${seoRules.title.minLength} and ${seoRules.title.maxLength} characters.`,
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
});

// Description analysis
const descriptionAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'description',
			title: 'Meta Description',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	const descriptionLength = props.description?.length || 0;
	const hasKeyphrase = props.description?.toLowerCase().includes(props.focusKeyphrase.toLowerCase()) || false;
	const isDescriptionLengthGood = descriptionLength >= seoRules.meta_description.minLength
		&& descriptionLength <= seoRules.meta_description.maxLength;

	if (!props.description) {
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
		return descriptionLength < seoRules.meta_description.minLength
			? {
					id: 'description',
					title: 'Meta Description',
					status: 'warning',
					message: `Meta description is too short (${descriptionLength} chars). The ideal length is between ${seoRules.meta_description.minLength} and ${seoRules.meta_description.maxLength} characters.`,
					details: {
						length: descriptionLength,
						hasKeyphrase,
						minLength: seoRules.meta_description.minLength,
						maxLength: seoRules.meta_description.maxLength,
					},
				}
			: {
					id: 'description',
					title: 'Meta Description',
					status: 'warning',
					message: `Meta description is too long (${descriptionLength} chars). The ideal length is between ${seoRules.meta_description.minLength} and ${seoRules.meta_description.maxLength} characters.`,
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
});

// Slug analysis
const slugAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'slug',
			title: 'URL Slug',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	if (!props.slug) {
		return {
			id: 'slug',
			title: 'URL Slug',
			status: 'error',
			message: 'Add a slug',
		};
	}

	const normalizedSlug = normalizeSlug(props.slug);
	const normalizedKeyphrase = normalizeSlug(props.focusKeyphrase);

	const hasKeyphrase = normalizedSlug.includes(normalizedKeyphrase);

	if (!hasKeyphrase) {
		return {
			id: 'slug',
			title: 'URL Slug',
			status: 'warning',
			message: 'Your focus keyphrase is not in the URL slug',
			details: {
				hasKeyphrase,
			},
		};
	}

	return {
		id: 'slug',
		title: 'URL Slug',
		status: 'good',
		message: 'Your slug contains the focus keyphrase',
		details: {
			hasKeyphrase,
		},
	};
});

// Content analysis
const contentAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'content',
			title: 'Content',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	// Combine content from all specified fields
	let combinedContent = '';

	if (props.contentFieldNames.length === 0 || !props.contentData) {
		return {
			id: 'content',
			title: 'Content',
			status: 'error',
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
			id: 'content',
			title: 'Content',
			status: 'error',
			message: 'Add some content to analyze',
		};
	}

	const cleanContent = normalizeContent(combinedContent);
	const wordCount = countWords(cleanContent);

	if (wordCount < 50) {
		return {
			id: 'content',
			title: 'Content',
			status: 'warning',
			message: 'Your content is too short for a proper keyword density analysis',
			details: {
				wordCount,
				density: 0,
				occurrences: 0,
				optimal: false,
			},
		};
	}

	const keyphraseOccurrences = countOccurrences(cleanContent, props.focusKeyphrase);
	const density = calculateDensity(cleanContent, props.focusKeyphrase);
	const isOptimalDensity = density >= 0.5 && density <= 2;

	if (keyphraseOccurrences === 0) {
		return {
			id: 'content',
			title: 'Content',
			status: 'error',
			message: 'Your focus keyphrase does not appear in the content',
			details: {
				wordCount,
				density: 0,
				occurrences: 0,
				optimal: false,
			},
		};
	}

	if (!isOptimalDensity) {
		return density < 0.5
			? {
					id: 'content',
					title: 'Content',
					status: 'warning',
					message: `Keyword density (${density.toFixed(1)}%) is too low. The optimal density is between 0.5% and 2.0%.`,
					details: {
						wordCount,
						density,
						occurrences: keyphraseOccurrences,
						optimal: false,
					},
				}
			: {
					id: 'content',
					title: 'Content',
					status: 'warning',
					message: `Keyword density (${density.toFixed(1)}%) is too high. The optimal density is between 0.5% and 2.0%.`,
					details: {
						wordCount,
						density,
						occurrences: keyphraseOccurrences,
						optimal: false,
					},
				};
	}

	return {
		id: 'content',
		title: 'Content',
		status: 'good',
		message: `Your content has a good keyword density (${density.toFixed(1)}%)`,
		details: {
			wordCount,
			density,
			occurrences: keyphraseOccurrences,
			optimal: true,
		},
	};
});

// Image Alt Text analysis
const imageAltTextAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	// Combine content from all specified fields to find images
	let combinedContent = '';

	for (const fieldName of props.contentFieldNames) {
		if (props.contentData[fieldName]) {
			combinedContent += ` ${props.contentData[fieldName]}`;
		}
	}

	if (!combinedContent.trim()) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'No content to analyze for images',
		};
	}

	const altTexts = extractImageAltText(combinedContent);

	if (altTexts.length === 0) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'neutral',
			message: 'No images found in the content',
		};
	}

	const keyphraseInAlt = altTexts.some((alt) =>
		alt.toLowerCase().includes(props.focusKeyphrase.toLowerCase()),
	);

	if (!keyphraseInAlt) {
		return {
			id: 'image_alt',
			title: 'Image Alt Text',
			status: 'warning',
			message: 'None of your images have alt attributes containing your focus keyphrase',
			details: {
				imageCount: altTexts.length,
				altTexts,
			},
		};
	}

	return {
		id: 'image_alt',
		title: 'Image Alt Text',
		status: 'good',
		message: 'At least one image has an alt attribute with the focus keyphrase',
		details: {
			imageCount: altTexts.length,
			altTexts,
		},
	};
});

// Subheadings analysis
const subheadingsAnalysis = computed((): AnalysisResult => {
	if (!props.focusKeyphrase) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'neutral',
			message: 'Add a focus keyphrase first',
		};
	}

	// Combine content from all specified fields to find subheadings
	let combinedContent = '';

	for (const fieldName of props.contentFieldNames) {
		if (props.contentData[fieldName]) {
			combinedContent += ` ${props.contentData[fieldName]}`;
		}
	}

	if (!combinedContent.trim()) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'neutral',
			message: 'No content to analyze for subheadings',
		};
	}

	const subheadings = extractSubheadings(combinedContent);

	if (subheadings.length === 0) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'warning',
			message: 'No subheadings found in the content',
		};
	}

	const keyphraseInSubheadings = subheadings.some((heading) =>
		heading.toLowerCase().includes(props.focusKeyphrase.toLowerCase()),
	);

	if (!keyphraseInSubheadings) {
		return {
			id: 'subheadings',
			title: 'Subheadings',
			status: 'warning',
			message: 'Your subheadings don\'t contain the focus keyphrase',
			details: {
				subheadingCount: subheadings.length,
				subheadings,
			},
		};
	}

	return {
		id: 'subheadings',
		title: 'Subheadings',
		status: 'good',
		message: 'Your focus keyphrase appears in at least one subheading',
		details: {
			subheadingCount: subheadings.length,
			subheadings,
		},
	};
});

// Combine all analysis results into a single array
const allAnalyses = computed((): AnalysisResult[] => {
	return [
		titleAnalysis.value,
		descriptionAnalysis.value,
		slugAnalysis.value,
		contentAnalysis.value,
		imageAltTextAnalysis.value,
		subheadingsAnalysis.value,
	];
});

// Filter results by status
const problemResults = computed(() => {
	return allAnalyses.value.filter((item) => item.status === 'error');
});

const improvementResults = computed(() => {
	return allAnalyses.value.filter((item) => item.status === 'warning');
});

const goodResults = computed(() => {
	return allAnalyses.value.filter((item) => item.status === 'good');
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
			return 'var(--theme--success)';
		case 'warning':
			return 'var(--theme--warning)';
		case 'error':
			return 'var(--theme--danger)';
		default:
			return 'var(--theme--foreground-subdued)';
	}
}

// Toggle section expanded state
function toggleSection(section: keyof typeof expandedSections.value): void {
	expandedSections.value[section] = !expandedSections.value[section];
}

// Add a new method to get details component based on result type
function getDetailsComponent(result: AnalysisResult) {
	if ((result.id === 'title' || result.id === 'description') && result.details?.length && result.details?.maxLength) {
		return {
			type: 'length',
			data: result.details,
		};
	}
	else if (result.id === 'content' && result.details?.wordCount) {
		return {
			type: 'content',
			data: result.details,
		};
	}
	else if (result.id === 'image_alt' && result.details?.imageCount) {
		return {
			type: 'image',
			data: result.details,
		};
	}
	else if (result.id === 'subheadings' && result.details?.subheadingCount) {
		return {
			type: 'subheadings',
			data: result.details,
		};
	}

	return null;
}

// Add these new functions
function expandAllSections() {
	expandedSections.value = {
		problems: true,
		improvements: true,
		goodResults: true,
	};
}

function collapseAllSections() {
	expandedSections.value = {
		problems: false,
		improvements: false,
		goodResults: false,
	};
}
</script>

<template>
	<div class="keyphrase-analysis">
		<label class="label field-label type-label">SEO Analysis</label>

		<div v-if="!focusKeyphrase" class="empty-state">
			Enter a focus keyphrase to analyze your content
		</div>

		<template v-else>
			<!-- Add action bar for expand/collapse controls -->
			<div class="action-bar">
				<v-button
					v-tooltip="'Collapse all'"
					:disabled="!expandedSections.problems && !expandedSections.improvements && !expandedSections.goodResults"
					icon
					small
					kind="secondary"
					title="Collapse all"
					@click="collapseAllSections"
				>
					<v-icon name="unfold_less" />
				</v-button>

				<v-button
					v-tooltip="'Expand all'"
					:disabled="expandedSections.problems && expandedSections.improvements && expandedSections.goodResults"
					icon
					small
					kind="secondary"
					title="Expand all"
					@click="expandAllSections"
				>
					<v-icon name="unfold_more" />
				</v-button>
			</div>

			<!-- Reusable Analysis Section -->
			<template
				v-for="(section, index) in [
					{
						id: 'problems',
						title: 'Problems',
						icon: 'error',
						iconClass: 'error',
						results: problemResults,
					},
					{
						id: 'improvements',
						title: 'Improvements',
						icon: 'warning',
						iconClass: 'warning',
						results: improvementResults,
					},
					{
						id: 'goodResults',
						title: 'Good results',
						icon: 'check_circle',
						iconClass: 'good',
						results: goodResults,
					},
				]" :key="index"
			>
				<div v-if="section.results.length > 0" class="analysis-section">
					<div
						class="section-header" :class="{
							active: expandedSections[section.id as keyof typeof expandedSections.value],
						}" @click="toggleSection(section.id as keyof typeof expandedSections.value)"
					>
						<v-icon
							:name="expandedSections[section.id as keyof typeof expandedSections.value] ? 'expand_more' : 'chevron_right'"
							class="section-icon"
						/>
						<div class="section-title" :class="section.id">
							<v-icon :name="section.icon" :class="section.iconClass" />
							{{ section.title }} ({{ section.results.length }})
						</div>
					</div>

					<div v-if="expandedSections[section.id as keyof typeof expandedSections.value]" class="section-content">
						<div
							v-for="result in section.results"
							:key="result.id"
							class="analysis-result"
							:class="result.status"
						>
							<v-icon
								small
								:name="getStatusIcon(result.status)"
								:style="{ color: getStatusColor(result.status) }"
							/>
							<div class="analysis-text">
								<p class="analysis-title">
									<span class="analysis-title-text">
										{{ result.title }}
									</span>
									<span class="analysis-title-subtext">
										{{ result.message }}
									</span>
								</p>

								<!-- Title & Description details -->
								<div v-if="getDetailsComponent(result)?.type === 'length'" class="analysis-details">
									Length: {{ result.details!.length }} characters
									<span class="meter-wrapper">
										<span
											class="meter"
											:style="{
												width: `${Math.min(100, (result.details!.length / result.details!.maxLength!) * 100)}%`,
												backgroundColor:
													(result.details!.minLength && result.details!.length < result.details!.minLength)
													|| result.details!.length > result.details!.maxLength!
														? 'var(--theme--warning)' : 'var(--theme--success)',
											}"
										/>
									</span>
								</div>

								<!-- Content details -->
								<div v-else-if="getDetailsComponent(result)?.type === 'content'" class="analysis-details">
									Word count: {{ result.details!.wordCount }}<br>
									<template v-if="result.details!.occurrences && result.details!.occurrences > 0 && result.details!.density !== undefined">
										Occurrences: {{ result.details!.occurrences }} times<br>
										Density: {{ result.details!.density.toFixed(1) }}%
										<span class="meter-wrapper">
											<span
												class="meter"
												:style="{
													width: `${Math.min(100, result.details!.density * 50)}%`,
													backgroundColor: result.details!.optimal
														? 'var(--theme--success)' : 'var(--theme--warning)',
												}"
											/>
										</span>
									</template>
								</div>

								<!-- Image alt text details -->
								<div v-else-if="getDetailsComponent(result)?.type === 'image'" class="analysis-details">
									Found {{ result.details!.imageCount }} images{{ result.status === 'good' ? ' with proper alt text' : '' }}
								</div>

								<!-- Subheadings details -->
								<div v-else-if="getDetailsComponent(result)?.type === 'subheadings'" class="analysis-details">
									Found {{ result.details!.subheadingCount }} subheadings
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</template>
	</div>
</template>

<style lang="scss" scoped>
.keyphrase-analysis {
	/* border: 2px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 1.5rem; */
}

.empty-state {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	padding: 12px 0;
}

.analysis-section {
	margin-bottom: 16px;
}

.section-header {
	display: flex;
	align-items: center;
	padding: 8px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
	cursor: pointer;
	user-select: none;

	&.active {
		border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
	}
}

.section-header:hover {
	background-color: var(--theme--background-normal);
}

.section-icon {
	margin-right: 8px;
}

.section-title {
	display: flex;
	align-items: center;
	font-weight: bold;
}

.section-title v-icon {
	margin-right: 8px;
}

.problems {
	color: var(--theme--danger);
}

.improvements {
	color: var(--theme--warning);
}

.good-results {
	color: var(--theme--success);
}

.error {
	--v-icon-color: var(--theme--danger);
	margin-right: 8px;
}

.warning {
	--v-icon-color: var(--theme--warning);
	margin-right: 8px;
}

.good {
	--v-icon-color: var(--theme--success);
	margin-right: 8px;
}

.section-content {
	padding: 8px;
	border: 1px solid var(--theme--border-color);
	border-top: none;
	border-radius: 0 0 var(--theme--border-radius) var(--theme--border-radius);
	margin-top: -4px;
}

.analysis-result {
	display: flex;
	align-items: start;
	gap: 12px;
	padding: 12px 0;
	border-bottom: 1px dashed var(--theme--border-color);

	.v-icon {
		margin-top: 0.25rem;
	}

	.analysis-title {
		margin: 0;
		.analysis-title-text {
			line-height: 1.5;
			font-size: 1rem;
			color: var(--theme--foreground);
			flex-shrink: 0;
			white-space: nowrap;
			margin-right: 0.5rem;
		}

		.analysis-title-subtext {
			line-height: 1.5;
			font-size: 0.9rem;
			font-weight: 400;
			color: var(--theme--foreground-subdued);
		}
	}
}

.analysis-result:last-child {
	border-bottom: none;
}

.analysis-text {
	flex: 1;
	flex-direction: column;
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

.action-bar {
	margin: 8px 0 16px;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
