<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import type { Style, Notation, Unit } from './utils/format-number';
import { useAutoFontFit } from './composables/use-auto-fit-text';
import { formatNumber } from './utils/format-number';
import { useI18n } from 'vue-i18n';
import { useSdk, useStores } from '@directus/extensions-sdk';


export type Header = {
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
	iconLeft?: string;
	iconRight?: string;
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
}

const props = withDefaults(defineProps<Props>(), {
	showHeader: false,
	method: 'GET',
	resultsPath: undefined,
	fieldIsNumber: false,
	headers: () => [] as Header[],
	prefix: '',
	suffix: '',
	iconLeft: undefined,
	iconRight: undefined,
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
});

type MetricType = string | number | Record<string, any> | null;

const { locale, t } = useI18n();
const client = useSdk();
const { useInsightsStore } = useStores();
const insightsStore = useInsightsStore();

const labelContainer = ref<HTMLDivElement | null>(null);
const labelText = ref<HTMLParagraphElement | null>(null);
const metric = ref<MetricType>(null);

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
	if (props.fontSize !== 'auto' || !metric.value) {
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


function createUrlParams(): string {
  const params = new URLSearchParams();

  if (props.url && props.url.trim() !== '') {
    params.append('requestUrl', props.url);
	}
	
  if (props.method) {
    params.append('requestMethod', props.method);
	}
	
  if (props.headers && props.headers.length > 0) {
    params.append('requestHeaders', JSON.stringify(props.headers));
	}
	
  if (props.body && Object.keys(props.body).length > 0) {
    params.append('requestBody', JSON.stringify(props.body));
	}

	if (props.resultsPath) {
    params.append('resultsPath', props.resultsPath);
  }

  return params.toString();
}


async function fetchMetric() {
	if (!props.url) {
		return;
	}

	const urlParams = createUrlParams();
	
	const response = await client.request(() => ({
		path: `/api-metric-endpoint?${urlParams}`,
		method: 'GET',
	}));

	metric.value = response.body.data;
}

onMounted(() => {
	updateFit();
	fetchMetric();
});

onUpdated(() => {
	updateFit();
});

const unsubscribeInsightsStore = insightsStore.$onAction(
	({ name, store, args, after, onError, }) => {
		if (name === 'refresh' || name === 'saveChanges') {
			fetchMetric();
		}
	}
)

onBeforeUnmount(() => {
	unmountResizeObserver();
	unsubscribeInsightsStore();
});


function displayValue(value: MetricType) {
	if (value === null || value === undefined) {
		return t('loading');
	}

	if (typeof value !== 'string' && typeof value !== 'number') {
		return 'Not a number';
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
				<v-icon v-if="iconLeft" :name="iconLeft" />
				{{ prefix }}
				{{ displayValue(metric) }}
				{{ suffix }}
				<v-icon v-if="iconRight" :name="iconRight" />
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
