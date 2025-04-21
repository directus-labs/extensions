<script setup lang="ts">
import type { AnalysisResult } from '../../analysis/types';
import { useDebounceFn } from '@vueuse/core';
import {
	AccordionContent,
	AccordionHeader,
	AccordionItem,
	AccordionRoot,
	AccordionTrigger,
} from 'reka-ui';
import { computed, inject, ref, watch } from 'vue';
import {
	analyzeContent,
	analyzeDescription,
	analyzeImageAltText,
	analyzeSlug,
	analyzeSubheadings,
	analyzeTitle,
} from '../../analysis/utils';
import AnalysisResultComponent from './AnalysisResult.vue';

type SectionId = 'problems' | 'improvements' | 'goodResults';

const props = defineProps<{
	focusKeyphrase: string;
	title: string;
	description: string;
	slug: string | null | undefined;
	contentFieldNames: string[];
}>();

const values = inject('values');

const analysisResults = ref<AnalysisResult[]>([]);

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

const openSectionIds = ref<SectionId[]>(['problems', 'improvements']);

const availableSectionIds = computed(() => sections.value.filter((s) => s.results.length > 0).map((s) => s.id));

function expandAllSections() {
	openSectionIds.value = availableSectionIds.value;
}

function collapseAllSections() {
	openSectionIds.value = [];
}

const analysisInput = computed(() => ({
	focusKeyphrase: props.focusKeyphrase,
	title: props.title,
	description: props.description,
	slug: props.slug,
	contentData: contentData.value,
	contentFieldNames: props.contentFieldNames,
}));

const runAnalysis = useDebounceFn(() => {
	if (!props.focusKeyphrase) {
		analysisResults.value = [];
		return;
	}

	analysisResults.value = [
		analyzeTitle(analysisInput.value),
		analyzeDescription(analysisInput.value),
		analyzeSlug(analysisInput.value),
		analyzeContent(analysisInput.value),
		analyzeImageAltText(analysisInput.value),
		analyzeSubheadings(analysisInput.value),
	];
}, 500);

watch(
	[
		() => props.focusKeyphrase,
		() => props.title,
		() => props.description,
		() => props.slug,
		() => contentData.value,
	],
	() => {
		runAnalysis();
	},
	{ deep: true, immediate: true },
);

const allAnalyses = computed(() => analysisResults.value);

const problemResults = computed(() => allAnalyses.value.filter((item) => item.status === 'error'));
const improvementResults = computed(() => allAnalyses.value.filter((item) => item.status === 'warning'));
const goodResults = computed(() => allAnalyses.value.filter((item) => item.status === 'good'));

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
		id: 'good' as SectionId,
		title: 'Good results',
		icon: 'check_circle',
		iconClass: 'good',
		results: goodResults.value,
	},
]);

const hasOnlyNeutralResults = computed(() => {
	return allAnalyses.value.length > 0 && availableSectionIds.value.length === 0;
});

const canCollapseAll = computed(() => openSectionIds.value.length > 0);
const canExpandAll = computed(() => openSectionIds.value.length < availableSectionIds.value.length);
</script>

<template>
	<div class="seo-analysis-container field">
		<div class="header">
			<label class="label field-label type-label">Analysis</label>
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
			<AccordionRoot
				v-model="openSectionIds"
				type="multiple"
				collapsible
				class="analysis-accordion"
				:unmount-on-hide="false"
			>
				<template v-for="section in sections" :key="section.id">
					<AccordionItem
						v-if="section.results.length > 0"
						:value="section.id"
						class="accordion-item"
					>
						<AccordionHeader class="accordion-header">
							<AccordionTrigger class="accordion-trigger">
								<div class="section-title" :class="section.id">
									<v-icon :name="section.icon" :class="section.iconClass" />
									{{ section.title }} ({{ section.results.length }})
								</div>
								<v-icon name="chevron_right" class="section-icon" />
							</AccordionTrigger>
						</AccordionHeader>
						<AccordionContent class="accordion-content">
							<AnalysisResultComponent
								v-for="result in section.results"
								:key="result.id"
								:result="result"
							/>
						</AccordionContent>
					</AccordionItem>
				</template>
			</AccordionRoot>

			<div v-if="hasOnlyNeutralResults" class="all-neutral-state">
				All analysis checks are neutral. This might happen if content is missing or too short.
			</div>
			<div v-else-if="allAnalyses.length === 0 && focusKeyphrase" class="no-results-state">
				Could not generate analysis results. Check configuration and content fields.
			</div>
		</template>
	</div>
</template>

<style lang="scss" scoped>
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
	margin-top: 16px;
}

.action-bar {
	margin-bottom: 16px;
	margin-top: -4px;
	display: flex;
	gap: 8px;
	justify-content: flex-end;
}

.analysis-accordion {
	display: flex;
	flex-direction: column;
	gap: 16px;

	.accordion-item {
		border: 1px solid var(--theme--border-color);
		border-radius: var(--theme--border-radius);
		overflow: hidden;
		transition: border-color 0.15s ease-in-out;

		&:focus-within {
			border-color: var(--theme--primary);
		}

		.accordion-header {
			margin: 0;

			.accordion-trigger {
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				padding: 8px;
				background-color: var(--theme--background-subdued);
				border: none;
				font-size: inherit;
				font-family: inherit;
				text-align: left;
				cursor: pointer;
				user-select: none;
				transition: background-color 0.15s ease-in-out;

				.section-title {
					display: flex;
					align-items: center;
					font-weight: bold;

					&.problems {
						color: var(--theme--danger);
					}
					&.improvements {
						color: var(--theme--warning);
					}
					&.good {
						color: var(--theme--success);
					}

					> .v-icon {
						margin-right: 8px;

						&.error {
							--v-icon-color: var(--theme--danger);
						}
						&.warning {
							--v-icon-color: var(--theme--warning);
						}
						&.good {
							--v-icon-color: var(--theme--success);
						}
					}
				}

				.section-icon {
					margin-left: 8px;
					color: var(--theme--foreground-subdued);
					transition: transform 0.2s ease-in-out;
				}

				&[data-state='open'] {
					border-bottom: 1px solid var(--theme--border-color);

					> .section-icon {
						transform: rotate(90deg);
					}
				}

				&:hover {
					background-color: var(--theme--background-normal);
				}
			}
		}

		.accordion-content {
			overflow: hidden;
			background-color: var(--theme--background);

			&[data-state='open'] {
				padding: 8px 8px 16px 8px;
				animation: slideDown 150ms ease-out;
				height: auto;
			}
			&[data-state='closed'] {
				padding-top: 0;
				padding-bottom: 0;
				padding-left: 8px;
				padding-right: 8px;
				animation: slideUp 150ms ease-out forwards;
			}
		}
	}
}

@keyframes slideDown {
	from {
		height: 0;
	}
	to {
		height: var(--reka-accordion-content-height);
	}
}

@keyframes slideUp {
	from {
		height: var(--reka-accordion-content-height);
	}
	to {
		height: 0;
	}
}
</style>
