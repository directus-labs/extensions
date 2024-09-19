<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import type { Style, Notation, Unit } from './utils/format-number';
import { useAutoFontFit } from './composables/use-auto-fit-text';
import { formatNumber } from './utils/format-number';
import { useI18n } from 'vue-i18n';


type Header = {
	header: string;
	value: string;
};

type ConditionalFormatting = Record<string, any>;


interface Props {
	showHeader?: boolean;
	method?: string | null;
	url: string;
	resultsPath?: string;
	fieldIsNumber?: boolean;
	headers?: Header[],
	body?: string | null;
	prefix?: string | null;
	suffix?: string | null;
	numberStyle?: Style;
	notation?: Notation;
	unit?: Unit;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	conditionalFormatting?: ConditionalFormatting[] | null;
	textAlign?: CSSProperties['text-align'];
	fontWeight?: number | undefined;
	fontStyle?: string | undefined;
	fontSize?: string;
	font?: 'sans-serif' | 'serif' | 'monospace';
	metric?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
	showHeader: false,
	method: 'GET',
	resultsPath: '.',
	fieldIsNumber: false,
	headers: () => [] as Header[],
	prefix: '',
	suffix: '',
	numberStyle: 'decimal',
	notation: 'standard',
	unit: undefined,
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
	conditionalFormatting: () => [],
	textAlign: 'center',
	fontWeight: 800,
	fontStyle: 'normal',
	fontSize: 'auto',
	font: 'sans-serif',
	metric: undefined,
});

const { locale } = useI18n();

const labelContainer = ref<HTMLDivElement | null>(null);
const labelText = ref<HTMLParagraphElement | null>(null);

const { adjustFontSize } = useAutoFontFit(labelContainer, labelText);

let resizeObserver: ResizeObserver | null = null;

function adjustPadding() {
	const container = labelContainer.value;
	if (!container) return;

	const paddingWidth = container.offsetWidth * 0.05;
	const paddingHeight = container.offsetHeight * 0.05;

	const padding = Math.round(Math.max(8, Math.min(paddingWidth, paddingHeight)));

	if (props.showHeader == true) {
		container.style.padding = '0px 12px 12px 12px';
	} else {
		container.style.padding = `${padding}px`;
	}

	return;
}

function unmountResizeObserver() {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
}

async function updateFit() {
	if (props.fontSize !== 'auto' || !props.metric) {
		unmountResizeObserver();
		return;
	}

	await document.fonts.ready;
	adjustPadding();
	adjustFontSize();

	if (!resizeObserver) {
		const container = labelContainer.value;
		if (!container) return;

		// Create a ResizeObserver to watch for changes in the container's dimensions
		resizeObserver = new ResizeObserver(() => {
			updateFit();
		});

		resizeObserver.observe(container);
	}

	adjustFontSize();
}

onMounted(() => {
	updateFit();
});

onUpdated(() => {
	updateFit();
});

onBeforeUnmount(() => {
	unmountResizeObserver();
});

const metric = computed(() => {
	if (!props.metric) return null;

	if (props.fieldIsNumber && !isNaN(Number(props.metric)) ) {
		return Number(props.metric);
	}

	return props.metric;
});

function displayValue(value: number | string) {
	if (value === null || value === undefined) {
		return 0;
	}

	return formatNumber(Number(value), locale.value, {
		notation: props.notation,
		style: props.numberStyle,
		unit: props.unit,
		minimumFractionDigits: props.minimumFractionDigits,
		maximumFractionDigits: props.maximumFractionDigits,
		currency: props.numberStyle === 'currency' ? String(props.unit) : undefined,
	});
}

const color = computed(() => {
	if (!metric.value) return null;

	let matchingFormat = null as ConditionalFormatting | null;

	for (const format of props.conditionalFormatting || []) {
		if (matchesOperator(format)) {
			matchingFormat = format;
		}
	}

	return matchingFormat?.color || 'var(--theme--primary)';

	function matchesOperator(format: Record<string, any>) {
		if (typeof metric.value === 'string') {
			const value = metric.value;
			const compareValue = format.value ?? '';

			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
			}
		} else {
			const value = Number(metric.value);
			const compareValue = Number(format.value ?? 0);

			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
				case '>':
					return value > compareValue;
				case '>=':
					return value >= compareValue;
				case '<':
					return value < compareValue;
				case '<=':
					return value < compareValue;
			}
		}

		return false;
	}
});
</script>


<template>
	<div ref="labelContainer" class="api-metric type-title selectable" :class="[font, { 'has-header': showHeader }]">
		<p
			ref="labelText"
			class="api-metric-text"
			:style="{ color, fontWeight, textAlign, fontStyle, fontSize: fontSize !== 'auto' ? fontSize : undefined }"
		>
			<template v-if="!props.url">
				Missing URL
			</template>

			<template v-else>
				{{ prefix }}
				{{ displayValue(metric) }}
				{{ suffix }}
			</template>
		</p>
	</div>

</template>


<style lang="scss"  scoped>
.api-metric-text {
	min-width: min-content;
	min-height: min-content;
	width: 100%;
}
.api-metric {
	display: flex;
	align-items: center;
	width: 100%;
	height: 100%;
	font-weight: 800;
	white-space: nowrap;
	line-height: 1.2;
	padding: 12px;

	&.sans-serif {
		font-family: var(--theme--fonts--sans--font-family);
	}

	&.serif {
		font-family: var(--theme--fonts--serif--font-family);
	}

	&.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}
</style>
