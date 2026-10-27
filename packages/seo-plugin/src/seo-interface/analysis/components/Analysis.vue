<script setup lang="ts">
import type { Ref } from 'vue';
import type { AnalysisResult } from '../../analysis/types';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { useSeoI18n } from '../../../lang/use-seo-i18n';
import { getPath } from '../../../shared/utils';
import {
	analyzeContent,
	analyzeDescription,
	analyzeImageAltText,
	analyzeSlug,
	analyzeSubheadings,
	analyzeTitle,
} from '../../analysis/utils';
import AnalysisResultComponent from './AnalysisResult.vue';

type SectionId = 'problems' | 'improvements' | 'good';

const props = defineProps<{
	focusKeyphrase: string;
	title: string;
	description: string;
	slugField: string | null | undefined;
	contentFields: string[] | string | undefined;
}>();

const { t } = useSeoI18n();

const values = inject('values') as Ref<Record<string, any>>;

const analysisResults = ref<AnalysisResult[]>([]);

const contentData = computed(() => {
	if (!props.contentFields || !values) {
		return {};
	}

	const fieldsToExtract = Array.isArray(props.contentFields) ? props.contentFields : [props.contentFields];

	return fieldsToExtract.reduce((acc, fieldName) => {
		const content = getPath(values.value, fieldName);

		if (content !== undefined && content !== null) {
			acc[fieldName] = content;
		}

		return acc;
	}, {} as Record<string, unknown>);
});

const contentString = computed(() => {
	let combined = '';
	if (!props.contentFields || !contentData.value) return combined;

	const fieldsToProcess = Array.isArray(props.contentFields) ? props.contentFields : [props.contentFields];

	for (const fieldName of fieldsToProcess) {
		const content = contentData.value[fieldName];

		if (content) {
			if (typeof content === 'string') {
				combined += ` ${content}`;
			}
			else {
				try {
					combined += ` ${JSON.stringify(content)}`;
				}
				catch {
					console.warn(`[SEO Plugin] Could not stringify content for field: ${fieldName}`);
				}
			}
		}
	}

	return combined.trim();
});

const slugValue = computed(() => (props.slugField && values?.value?.[props.slugField]) || '');

const analysisInput = computed(() => ({
	focusKeyphrase: props.focusKeyphrase,
	title: props.title,
	description: props.description,
	slug: slugValue.value,
	combinedContent: contentString.value,
}));

let analysisTimer: ReturnType<typeof setTimeout> | undefined;

function runAnalysis() {
	clearTimeout(analysisTimer);
	analysisTimer = setTimeout(analyze, 500);
}

onBeforeUnmount(() => clearTimeout(analysisTimer));

function analyze() {
	if (!props.focusKeyphrase) {
		analysisResults.value = [];
		return;
	}

	const hasContentFields = props.contentFields && (Array.isArray(props.contentFields) ? props.contentFields.length > 0 : !!props.contentFields);

	analysisResults.value = [
		analyzeTitle(analysisInput.value),
		analyzeDescription(analysisInput.value),
		analyzeSlug(analysisInput.value),
		...(hasContentFields
			? [
					analyzeContent(analysisInput.value),
					analyzeImageAltText(analysisInput.value),
					analyzeSubheadings(analysisInput.value),
				]
			: []),
	];
}

watch(
	[
		() => props.focusKeyphrase,
		() => props.title,
		() => props.description,
		() => slugValue.value,
		() => contentData.value,
	],
	runAnalysis,
	{ deep: true },
);

// Panels mount on tab switch, so analyze right away instead of after the debounce
analyze();

const allAnalyses = computed(() => analysisResults.value);

const problemResults = computed(() => allAnalyses.value.filter((item) => item.status === 'error'));
const improvementResults = computed(() => allAnalyses.value.filter((item) => item.status === 'warning'));
const goodResults = computed(() => allAnalyses.value.filter((item) => item.status === 'good'));

const openSectionIds = ref<SectionId[]>(['problems', 'improvements']);

const sections = computed(() => [
	{
		id: 'problems' as SectionId,
		title: 'seo_plugin.analysis.problems',
		icon: 'error',
		iconClass: 'error',
		results: problemResults.value,
	},
	{
		id: 'improvements' as SectionId,
		title: 'seo_plugin.analysis.improvements',
		icon: 'warning',
		iconClass: 'warning',
		results: improvementResults.value,
	},
	{
		id: 'good' as SectionId,
		title: 'seo_plugin.analysis.good_results',
		icon: 'check_circle',
		iconClass: 'good',
		results: goodResults.value,
	},
]);

const availableSectionIds = computed(() => sections.value.filter((s) => s.results.length > 0).map((s) => s.id));

function expandAllSections() {
	openSectionIds.value = availableSectionIds.value;
}

function collapseAllSections() {
	openSectionIds.value = [];
}

function toggleSection(id: SectionId) {
	openSectionIds.value = openSectionIds.value.includes(id)
		? openSectionIds.value.filter((openId) => openId !== id)
		: [...openSectionIds.value, id];
}

const hasOnlyNeutralResults = computed(() => {
	return allAnalyses.value.length > 0 && availableSectionIds.value.length === 0;
});

const canCollapseAll = computed(() => availableSectionIds.value.some((id) => openSectionIds.value.includes(id)));
const canExpandAll = computed(() => availableSectionIds.value.some((id) => !openSectionIds.value.includes(id)));
</script>

<template>
	<div class="seo-analysis-container field">
		<div class="header">
			<label class="label field-label type-label">{{ t('seo_plugin.analysis.label') }}</label>
			<div class="action-bar">
				<v-button
					v-tooltip="t('seo_plugin.analysis.collapse_all')"
					:disabled="!canCollapseAll"
					icon
					small
					secondary
					:title="t('seo_plugin.analysis.collapse_all')"
					@click="collapseAllSections"
				>
					<v-icon name="unfold_less" />
				</v-button>

				<v-button
					v-tooltip="t('seo_plugin.analysis.expand_all')"
					:disabled="!canExpandAll"
					icon
					small
					secondary
					:title="t('seo_plugin.analysis.expand_all')"
					@click="expandAllSections"
				>
					<v-icon name="unfold_more" />
				</v-button>
			</div>
		</div>

		<div v-if="!focusKeyphrase" class="empty-state">
			{{ t('seo_plugin.analysis.empty') }}
		</div>

		<template v-else>
			<div class="analysis-accordion">
				<template v-for="section in sections" :key="section.id">
					<div v-if="section.results.length > 0" class="accordion-item">
						<h3 class="accordion-header">
							<button
								type="button"
								class="accordion-trigger"
								:aria-expanded="openSectionIds.includes(section.id)"
								:data-state="openSectionIds.includes(section.id) ? 'open' : 'closed'"
								@click="toggleSection(section.id)"
							>
								<div class="section-title" :class="section.id">
									<v-icon :name="section.icon" :class="section.iconClass" />
									{{ t(section.title) }} ({{ section.results.length }})
								</div>
								<v-icon name="chevron_right" class="section-icon" />
							</button>
						</h3>
						<div v-if="openSectionIds.includes(section.id)" class="accordion-content">
							<AnalysisResultComponent
								v-for="result in section.results"
								:key="result.id"
								:result="result"
							/>
						</div>
					</div>
				</template>
			</div>

			<div v-if="hasOnlyNeutralResults" class="all-neutral-state">
				{{ t('seo_plugin.analysis.all_neutral') }}
			</div>
			<div v-else-if="allAnalyses.length === 0 && focusKeyphrase" class="no-results-state">
				{{ t('seo_plugin.analysis.no_results') }}
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

			padding: 8px 8px 16px 8px;
		}
	}
}
</style>
