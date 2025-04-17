<script setup lang="ts">
import type { AnalysisResult } from '../../types';
import { computed, inject, ref, toRefs } from 'vue';
import {
	analyzeContent,
	analyzeDescription,
	analyzeImageAltText,
	analyzeSlug,
	analyzeSubheadings,
	analyzeTitle,
} from '../../utils/analysisUtils';
import AnalysisSection from './AnalysisSection.vue';

// Define Section IDs explicitly for type safety
type SectionId = 'problems' | 'improvements' | 'goodResults';

const props = defineProps<{
	focusKeyphrase: string;
	title: string;
	description: string;
	slug: string | null | undefined;
	// contentData: Record<string, unknown>;
	contentFieldNames: string[];
}>();

const values = inject('values');

const contentData = computed(() => {
	const data: Record<string, unknown> = {};

	if (!props.contentFieldNames || !values) {
		return {};
	}

	const fields = Array.isArray(props.contentFieldNames) ? props.contentFieldNames : [props.contentFieldNames];

	for (const field of fields) {
		if (field in values.value) {
			data[field] = values.value[field];
		}
	}

	return data;
});

// --- State for Expanded Sections ---
const expandedSections = ref<Record<SectionId, boolean>>({
	problems: true,
	improvements: true,
	goodResults: false,
});

function toggleSection(sectionId: SectionId): void {
	expandedSections.value[sectionId] = !expandedSections.value[sectionId];
}

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

// --- Analysis Calculation ---
const analysisInput = computed(() => ({
	focusKeyphrase: props.focusKeyphrase,
	title: props.title,
	description: props.description,
	slug: props.slug,
	contentData: contentData.value,
	contentFieldNames: props.contentFieldNames,
}));

const allAnalyses = computed((): AnalysisResult[] => {
	if (!props.focusKeyphrase) return []; // Don't analyze if no keyphrase
	return [
		analyzeTitle(analysisInput.value),
		analyzeDescription(analysisInput.value),
		analyzeSlug(analysisInput.value),
		analyzeContent(analysisInput.value),
		analyzeImageAltText(analysisInput.value),
		analyzeSubheadings(analysisInput.value),
	];
});

const problemResults = computed(() => allAnalyses.value.filter((item) => item.status === 'error'));
const improvementResults = computed(() => allAnalyses.value.filter((item) => item.status === 'warning'));
const goodResults = computed(() => allAnalyses.value.filter((item) => item.status === 'good'));

// --- Section Definitions for Template ---
const sections = computed(() => [
	{
		id: 'problems' as SectionId,
		title: 'Problems',
		icon: 'error',
		iconClass: 'error',
		results: problemResults.value,
	},
	{
		id: 'improvements' as SectionId,
		title: 'Improvements',
		icon: 'warning',
		iconClass: 'warning',
		results: improvementResults.value,
	},
	{
		id: 'goodResults' as SectionId,
		title: 'Good results',
		icon: 'check_circle',
		iconClass: 'good',
		results: goodResults.value,
	},
]);

// --- Computed properties for button states ---
const canCollapseAll = computed(() => expandedSections.value.problems || expandedSections.value.improvements || expandedSections.value.goodResults);
const canExpandAll = computed(() => !expandedSections.value.problems || !expandedSections.value.improvements || !expandedSections.value.goodResults);
</script>

<template>
	<div class="seo-analysis-container field">
		<div class="header">
			<label class="label field-label type-label">Analysis</label>
			<!-- Action bar for expand/collapse controls -->
			<div class="action-bar">
				<v-button
					v-tooltip="'Collapse all'"
					:disabled="!canCollapseAll"
					icon
					small
					secondary
					title="Collapse all"
					@click="collapseAllSections"
				>
					<v-icon name="unfold_less" />
				</v-button>

				<v-button
					v-tooltip="'Expand all'"
					:disabled="!canExpandAll"
					icon
					small
					secondary
					title="Expand all"
					@click="expandAllSections"
				>
					<v-icon name="unfold_more" />
				</v-button>
			</div>
		</div>

		<div v-if="!focusKeyphrase" class="empty-state">
			Enter a focus keyphrase to analyze your content.
		</div>

		<template v-else>
			<!-- Render Analysis Sections -->
			<AnalysisSection
				v-for="section in sections"
				:key="section.id"
				:section-id="section.id"
				:title="section.title"
				:icon="section.icon"
				:icon-class="section.iconClass"
				:results="section.results"
				:is-expanded="expandedSections[section.id]"
				@toggle-section="toggleSection"
			/>

			<!-- Optional: Message if all results are neutral/no results -->
			<div v-if="allAnalyses.length > 0 && problemResults.length === 0 && improvementResults.length === 0 && goodResults.length === 0" class="all-neutral-state">
				All analysis checks are neutral. This might happen if content is missing or too short.
			</div>
			<div v-else-if="allAnalyses.length === 0 && focusKeyphrase" class="no-results-state">
				Could not generate analysis results. Check configuration and content fields.
			</div>
		</template>
	</div>
</template>

<style scoped>
.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.label {
	margin-bottom: 0.5rem;
}
.type-label {
	margin-bottom: 1rem;
}

.empty-state,
.all-neutral-state,
.no-results-state {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	padding: 12px 8px;
	border: 1px dashed var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-subdued);
	text-align: center;
}

.action-bar {
	margin-bottom: 16px;
	margin-top: -4px;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}
</style>
