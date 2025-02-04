<script lang="ts">
import { useApi, useStores } from '@directus/extensions-sdk';
import formatTitle from '@directus/format-title';
import { abbreviateNumber } from '@directus/utils';
import ApexCharts from 'apexcharts';
import { get } from 'lodash';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		width: {
			type: Number,
			default: 12,
		},
		height: {
			type: Number,
			default: 8,
		},
		collection: {
			type: String,
			default: null,
		},
		filter: {
			type: Object,
			default: {},
		},
		dataValues: {
			type: String,
			default: null,
		},
		dataLabels: {
			type: String,
			default: null,
		},
		labelGrouping: {
			type: String,
			default: 'sum',
		},
		series: {
			type: String,
			default: null,
		},
		color: {
			type: String,
			default: '#6644FF',
		},
		showMarker: {
			type: Boolean,
			default: true,
		},
		showDataLabel: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const api = useApi();
		const { usePermissionsStore } = useStores();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const hasError = ref<boolean>(false);

		const errorResponse = ref<Record<string, string>>({
			title: '',
			message: '',
		});

		const isLoading = ref<boolean>(true);

		const chartEl = ref();
		const chart = ref<ApexCharts>();

		onMounted(setUpChart);

		watch(
			[
				() => props.collection,
				() => props.filter,
				() => props.dataValues,
				() => props.dataLabels,
				() => props.color,
				() => props.width,
				() => props.height,
				() => props.labelGrouping,
				() => props.series,
				() => props.showMarker,
				() => props.showDataLabel,
			],
			() => {
				chart.value?.destroy();
				setUpChart();
			},
		);

		onUnmounted(() => {
			chart.value?.destroy();
		});

		async function setUpChart() {
			if (!props.dataValues || !props.dataLabels)
				return;

			const showToolTip = props.showMarker;
			let categories: Array<string> = [];
			const category_data: Record<string, Array<Record<string, any>>> = {};

			try {
				const response = await api.get(`/items/${props.collection}`, {
					params: {
						limit: '-1',
						filter: {
							_and: [
								props.filter,
								{
									[props.dataLabels]: { _nempty: true },
								},
							],
						},
						aggregate: {
							[props.labelGrouping]: props.dataValues,
						},
						groupBy: [props.dataLabels, props.series],
					},
				});

				response.data.data.forEach((item: Record<string, any>) => {
					const label: string = get(item, props.dataLabels);
					const category: string = props.series ? get(item, props.series) : props.collection;
					const y_value: number = get(item[props.labelGrouping], props.dataValues);

					if (!(category in category_data)) {
						category_data[category] = [];
					}

					category_data[category].push({
						x: formatTitle(label),
						y: y_value == y_value * 1 ? y_value * 1 : y_value,
					});
				});

				categories = Object.keys(category_data);

				const series: Array<Record<string, any>> = props.series
					? categories.map((category: string) => {
							return {
								name: formatTitle(category),
								data: category_data[category],
							};
						})
					: [
							{
								name: formatTitle(props.collection),
								data: category_data[props.collection],
							},
						];

				const isSparkline = props.width < 12 || props.height < 10;

				chart.value = new ApexCharts(chartEl.value, {
					colors: props.series || props.color == null ? [] : [props.color],
					chart: {
						type: 'treemap',
						animation: {
							enabled: false,
						},
						height: '100%',
						width: '100%',
						dropShadow: {
							enabled: false,
						},
						toolbar: {
							show: false,
						},
						selection: {
							enabled: false,
						},
						zoom: {
							enabled: false,
						},
						fontFamily: 'var(--theme--fonts--sans--font-family)',
						foreColor: 'var(--theme--foreground-subdued)',
						sparkline: {
							enabled: isSparkline,
						},
					},
					plotOptions: {
						treemap: {
							shadeIntensity: 0.2,
						},
					},
					series,
					tooltip: {
						enabled: showToolTip,
					},
					dataLabels: {
						enabled: props.showDataLabel,
						formatter(text: string, opt: Record<string, any>) {
							return `${text}: ${(opt.value > 10000 ? abbreviateNumber(opt.value, 1) : opt.value)}`;
						},
						dropShadow: {
							enabled: true,
						},
					},
					grid: {
						borderColor: 'var(--theme--border-color-subdued)',
						padding: isSparkline
							? {
									top: props.showHeader ? 0 : 5,
									bottom: 5,
									left: 0,
									right: 0,
								}
							: {
									top: props.showHeader ? -20 : -2,
									bottom: 10,
									left: 5,
									right: 5,
								},
					},
					xaxis: {
						show: false,
						axisTicks: {
							show: false,
						},
					},
					yaxis: {
						show: false,
					},
					legend: {
						show: !isSparkline,
					},
				});

				chart.value.render();
				isLoading.value = false;
			}
			catch (error: any) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				hasError.value = true;
				isLoading.value = false;
			}

			;
		}

		return {
			t,
			isLoading,
			chartEl,

			// Errors
			hasError,
			errorResponse,

			// Permission
			canRead,
		};
	},
});
</script>

<template>
	<div class="treemap-chart" :class="{ 'has-header': showHeader }">
		<v-info v-if="!collection" type="danger" icon="error" :center="true" title="No Collection Selected" />
		<v-info v-else-if="!dataValues || !dataLabels" type="warning" icon="warning" :center="true" title="Both Value and Label fields must be selected" />
		<v-info v-else-if="!canRead" type="danger" icon="error" :center="true" title="Forbidden">
			You do not have permissions to see this table
		</v-info>
		<v-info v-else-if="hasError" type="danger" icon="error" :title="errorResponse?.title">
			{{ errorResponse?.message }}
		</v-info>
		<VProgressCircular v-else-if="isLoading" :indeterminate="true" />
		<v-info v-else-if="!isLoading && !chartEl" type="danger" icon="error" :center="true" title="Incompatible Data">
			The current data is not compatiple with the scatter plot.
		</v-info>
		<div ref="chartEl" />
	</div>
</template>

<style scoped>
.treemap-chart {
	height: 100%;
	padding: 12px;
}

.treemap-chart.has-header {
	padding: 0 12px 12px;
}
</style>

<style>
.treemap-chart rect.apexcharts-treemap-rect {
	stroke: var(--theme--background-subdued);
}

.treemap-chart path.apexcharts-legend-marker {
	stroke: transparent;
}

.treemap-chart .apexcharts-tooltip {
	background-color: var(--theme--background-normal) !important;
	border-color: var(--theme--border-color) !important;
	font-family: var(--theme--fonts--sans--font-family) !important;
	color: var(--theme--foreground-accent) !important;
}
</style>
