<script setup lang="ts">
import type { AnalysisResult, AnalysisResultDetails, AnalysisStatus } from '../types';
import { computed } from 'vue';

const props = defineProps<{
	result: AnalysisResult;
}>();

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

type DetailComponentType = 'length' | 'content' | 'image' | 'subheadings';

interface DetailComponent {
	type: DetailComponentType;
	data: AnalysisResultDetails;
}

// Determine which details sub-component to show based on result ID and details
const detailComponent = computed((): DetailComponent | null => {
	const details = props.result.details;
	if (!details) return null;

	if ((props.result.id === 'title' || props.result.id === 'description') && typeof details.length === 'number' && typeof details.maxLength === 'number') {
		return { type: 'length', data: details };
	}

	if (props.result.id === 'content' && typeof details.wordCount === 'number') {
		return { type: 'content', data: details };
	}

	if (props.result.id === 'image_alt' && typeof details.imageCount === 'number') {
		return { type: 'image', data: details };
	}

	if (props.result.id === 'subheadings' && typeof details.subheadingCount === 'number') {
		return { type: 'subheadings', data: details };
	}

	return null;
});

const isLengthMeterWarning = computed(() => {
	if (detailComponent.value?.type !== 'length' || detailComponent.value.data.length === 0 || !detailComponent.value.data.minLength || !detailComponent.value.data.maxLength) return false;
	const { length, minLength, maxLength } = detailComponent.value.data;
	return length < minLength || length > maxLength;
});

const lengthMeterWidth = computed(() => {
	if (detailComponent.value?.type !== 'length' || detailComponent.value.data.length === 0 || !detailComponent.value.data.maxLength) return 0;
	const { length, maxLength } = detailComponent.value.data;
	return Math.min(100, (length / maxLength) * 100);
});

const isDensityMeterWarning = computed(() => {
	if (detailComponent.value?.type !== 'content') return false;
	return !detailComponent.value.data.optimal;
});

const densityMeterWidth = computed(() => {
	if (detailComponent.value?.type !== 'content' || typeof detailComponent.value.data.density !== 'number') return 0;
	return Math.min(100, detailComponent.value.data.density * 50); // Density target is 0.5-2%, so 1% = 50 width
});

// Removed inject('values') and related unused computed properties:
// const values = inject('values') as Ref<Record<string, any>>;
// const slugValue = computed(...)
// const contentFieldValues = computed(...)
// const contentFieldNames = computed(...)
</script>

<template>
	<div
		class="analysis-result"
		:class="result.status"
	>
		<div :style="{ backgroundColor: getStatusColor(result.status) }" class="analysis-dot" />
		<div class="analysis-text">
			<p class="analysis-title">
				<span class="analysis-title-text">
					{{ result.title }}
				</span>
				<span class="analysis-title-subtext">
					{{ result.message }}
				</span>
			</p>

			<div v-if="detailComponent" class="analysis-details">
				<!-- Title & Description details -->
				<div v-if="detailComponent.type === 'length'">
					Length: {{ detailComponent.data.length }} characters
					<span class="meter-wrapper">
						<span
							class="meter"
							:style="{
								width: `${lengthMeterWidth}%`,
								backgroundColor: isLengthMeterWarning ? 'var(--theme--warning)' : 'var(--theme--success)',
							}"
						/>
					</span>
				</div>

				<!-- Content details -->
				<div v-else-if="detailComponent.type === 'content'">
					Word count: {{ detailComponent.data.wordCount }}
					<template v-if="detailComponent.data.occurrences && detailComponent.data.occurrences > 0 && typeof detailComponent.data.density === 'number'">
						<br>Occurrences: {{ detailComponent.data.occurrences }} times
						<br>Density: {{ detailComponent.data.density.toFixed(1) }}%
						<span class="meter-wrapper">
							<span
								class="meter"
								:style="{
									width: `${densityMeterWidth}%`,
									backgroundColor: isDensityMeterWarning ? 'var(--theme--warning)' : 'var(--theme--success)',
								}"
							/>
						</span>
					</template>
				</div>

				<!-- Image alt text details -->
				<div v-else-if="detailComponent.type === 'image'">
					Found {{ detailComponent.data.imageCount }} images{{ result.status === 'good' ? ' with proper alt text' : '' }}
					<ul v-if="detailComponent.data.altTexts && detailComponent.data.altTexts.length > 0">
						<li v-for="(alt, index) in detailComponent.data.altTexts" :key="index">
							"{{ alt }}"
						</li>
					</ul>
				</div>

				<!-- Subheadings details -->
				<div v-else-if="detailComponent.type === 'subheadings'">
					Found {{ detailComponent.data.subheadingCount }} subheadings
					<ul v-if="detailComponent.data.subheadings && detailComponent.data.subheadings.length > 0">
						<li v-for="(heading, index) in detailComponent.data.subheadings" :key="index">
							"{{ heading }}"
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.analysis-result {
	display: flex;
	align-items: start;
	gap: 12px;
	padding: 8px;
	border-bottom: 1px dashed var(--theme--border-color);

	.analysis-dot {
		margin-top: 0.5rem;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.v-icon {
		margin-top: 0.25rem;
		flex-shrink: 0;
	}
}

.analysis-result:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.analysis-text {
	flex: 1;
	flex-direction: column;
	min-width: 0;
}

.analysis-title {
	margin: 0 0 4px 0;
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.5rem;
}

.analysis-title-text {
	line-height: 1.5;
	font-size: 1rem;
	font-weight: bold;
	color: var(--theme--foreground);
	flex-shrink: 0;
	white-space: nowrap;
}

.analysis-title-subtext {
	line-height: 1.5;
	font-size: 0.9rem;
	font-weight: 400;
	color: var(--theme--foreground-subdued);
}

.analysis-details {
	font-size: 0.85em;
	color: var(--theme--foreground-subdued);
	margin-top: 4px;
}

.analysis-details ul {
	margin: 4px 0 0 1rem;
	padding: 0;
	list-style: disc;
}
.analysis-details li {
	margin-bottom: 2px;
}

.meter-wrapper {
	display: inline-block;
	width: 100px;
	height: 4px;
	background-color: var(--theme--background);
	border-radius: 2px;
	margin-left: 8px;
	overflow: hidden;
	vertical-align: middle;
}

.meter {
	display: block;
	height: 100%;
	border-radius: 2px;
}
</style>
