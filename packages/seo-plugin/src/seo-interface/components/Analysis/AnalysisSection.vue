<script setup lang="ts">
import type { AnalysisResult } from '../types';
import AnalysisResultComponent from './AnalysisResult.vue';

// Define Section IDs explicitly for type safety
type SectionId = 'problems' | 'improvements' | 'goodResults';

const props = defineProps<{
	sectionId: SectionId;
	title: string;
	icon: string;
	iconClass: string;
	results: AnalysisResult[];
	isExpanded: boolean;
}>();

const emit = defineEmits<{
	(e: 'toggle-section', sectionId: SectionId): void;
}>();
</script>

<template>
	<div v-if="results.length > 0" class="analysis-section">
		<div
			class="section-header"
			:class="{ active: isExpanded }"
			@click="emit('toggle-section', sectionId)"
		>
			<div class="section-title" :class="sectionId">
				<v-icon :name="icon" :class="iconClass" />
				{{ title }} ({{ results.length }})
			</div>

			<v-icon
				:name="isExpanded ? 'expand_more' : 'chevron_right'"
				class="section-icon"
			/>
		</div>

		<div v-if="isExpanded" class="section-content">
			<AnalysisResultComponent
				v-for="result in results"
				:key="result.id"
				:result="result"
			/>
		</div>
	</div>
</template>

<style scoped>
.analysis-section {
	margin-bottom: 16px;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	border: 1px solid var(--theme--border-color);
	cursor: pointer;
	user-select: none;
	transition: background-color 0.15s ease-in-out;

	&.active {
		border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
		border-bottom-color: transparent; /* Hide bottom border when active */
	}
}

.section-header:hover {
	background-color: var(--theme--background-normal);
}

.section-icon {
	margin-right: 8px;
	color: var(--theme--foreground-subdued);
}

.section-title {
	display: flex;
	align-items: center;
	font-weight: bold;
}

.section-title v-icon {
	margin-right: 8px;
}

/* Specific section title colors */
.problems {
	color: var(--theme--danger);
}

.improvements {
	color: var(--theme--warning);
}

.goodResults {
	/* Use camelCase matching the ID */
	color: var(--theme--success);
}

/* Specific icon colors within titles */
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
	padding: 8px 8px 16px 8px; /* Added more bottom padding */
	border: 1px solid var(--theme--border-color);
	border-top: none;
	border-radius: 0 0 var(--theme--border-radius) var(--theme--border-radius);
	/* Removed margin-top: -4px as the border handling is cleaner now */
}
</style>
