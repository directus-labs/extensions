<script setup lang="ts">
import type { CSSProperties } from 'vue';

const SIMPLE_UNITS = [
	'acre',
	'bit',
	'byte',
	'celsius',
	'centimeter',
	'day',
	'degree',
	'fahrenheit',
	'fluid-ounce',
	'foot',
	'gallon',
	'gigabit',
	'gigabyte',
	'gram',
	'hectare',
	'hour',
	'inch',
	'kilobit',
	'kilobyte',
	'kilogram',
	'kilometer',
	'liter',
	'megabit',
	'megabyte',
	'meter',
	'mile',
	'mile-scandinavian',
	'millimeter',
	'milliliter',
	'millisecond',
	'minute',
	'month',
	'ounce',
	'percent',
	'petabyte',
	'pound',
	'second',
	'stone',
	'terabit',
	'terabyte',
	'week',
	'yard',
	'year',
] as const;

type SimpleUnit = (typeof SIMPLE_UNITS)[number];

type Header = {
	header: string;
	value: string;
};

type Style = 'decimal' | 'currency' | 'percent' | 'unit';

type Notation = 'standard' | 'scientific' | 'engineering' | 'compact';

type Unit = SimpleUnit | `${SimpleUnit}-per-${SimpleUnit}`; // Compound unit type

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
	conditionalFormatting?: Record<string, any>[] | null;
	textAlign?: CSSProperties['text-align'];
	fontWeight?: number | undefined;
	fontStyle?: string | undefined;
	fontSize?: string;
	font?: 'sans-serif' | 'serif' | 'monospace';
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
});
</script>


<template>
	<div ref="labelContainer" class="api-metric type-title selectable" :class="[font, { 'has-header': showHeader }]">
		<p v-if="!props.url">
			Missing URL
		</p>
		<p
			v-else
			ref="labelText"
			class="api-metric-text"
			:style="{ fontWeight, textAlign, fontStyle, fontSize: fontSize !== 'auto' ? fontSize : undefined }"
		>
			{{ prefix }}
			{{ suffix }}
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
