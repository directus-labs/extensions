<template>
	<div class="funnnel-chart" :class="{ 'has-header': showHeader }">
		<v-info type="danger" icon="error" :center="true" v-if="!collection" title="No Collection Selected"></v-info>
		<v-info type="warning" icon="warning" :center="true" v-else-if="!dataValues || !dataLabels" title="Both Value and Label fields must be selected"></v-info>
		<v-info type="danger" icon="error" :center="true" v-else-if="!canRead" title="Forbidden">You do not have permissions to see this table</v-info>
		<v-info type="danger" icon="error" v-else-if="hasError" :title="errorResponse?.title">{{ errorResponse?.message }}</v-info>
		<VProgressCircular v-else-if="isLoading" :indeterminate="true"/>
		<v-info type="danger" icon="error" :center="true" v-else-if="!isLoading && !chartEl" title="Incompatible Data">The current data is not compatiple with the scatter plot.</v-info>
		<div ref="chartEl" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import { abbreviateNumber } from '@directus/shared/utils';
import formatTitle from '@directus/format-title';
import { defineComponent, computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ApexCharts from 'apexcharts'
import { get } from 'lodash';

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
		color: {
			type: String,
			default: '#6644FF',
		},
		labelGrouping: {
			type: String,
			default: 'sum',
		},
		sortDirection: {
			type: String,
			default: 'desc',
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
	setup(props){

		const { t } = useI18n();
		const api = useApi();
		const { usePermissionsStore } = useStores();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const hasError = ref<boolean>(false);
		const errorResponse = ref<Record<string, String>>({
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
				() => props.sortDirection,
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
			if (!props.dataValues || !props.dataLabels) return;

			const showToolTip = props.showMarker;
			const categories = ref<Array<string>>([]);
			const category_data = ref<Array<number>>([]);

			try{
				const response = await api.get(`/items/${props.collection}`,{
					params: {
						limit: '-1',
						filter: {
							"_and": [
								props.filter,
								{
									[props.dataLabels]: { "_nempty": true }
								}
							]
						},
						aggregate: {
							[props.labelGrouping]: props.dataValues,
						},
						groupBy: [props.dataLabels],
					}
				});

				const data: Array<Record<string,any>> = response.data.data.sort((a: Record<string,any>,b: Record<string,any>) => props.sortDirection == 'desc'
					? b[props.labelGrouping].value - a[props.labelGrouping].value
					: a[props.labelGrouping].value - b[props.labelGrouping].value
				);
				data.forEach((item: Record<string, any>) => {
					categories.value.push(formatTitle(get(item, props.dataLabels)));
					let y_value = get(item[props.labelGrouping], props.dataValues);
					category_data.value.push(y_value == y_value * 1 ? y_value * 1 : y_value);
				});
				
				const series: Array<Record<string,any>> = [{
					name: formatTitle(props.collection),
					data: category_data.value,
				}];

				const isSparkline = props.width < 12 || props.height < 10;

				chart.value = new ApexCharts(chartEl.value, {
					colors: props.color == null ? ['#6644FF'] : [props.color],
					chart: {
						type: 'bar',
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
					series: series,
					plotOptions: {
						bar: {
							borderRadius: 0,
							horizontal: true,
							barHeight: '80%',
							isFunnel: true,
						},
					},
					dataLabels: {
						enabled: props.showDataLabel,
						formatter: function (value: number, opt: Record<string, any>) {
							return opt.w.globals.labels[opt.dataPointIndex] + ':  ' + (value > 10000 ? abbreviateNumber(value, 1) : value)
						},
						dropShadow: {
							enabled: true,
						},
					},
					tooltip: {
						enabled: showToolTip,
						custom: function({series, seriesIndex, dataPointIndex, w}) {
							var value: number = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
							var label: string = w.globals.labels[dataPointIndex];
							return `<div class="funnel-tooltip"><span><strong>${label}</strong></span>:&nbsp;<span>${(value > 10000 ? abbreviateNumber(value, 1) : value)}</span></div>`;
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
								bottom: 0,
								left: 0,
								right: 0,
							},
					},
					xaxis: {
						categories: categories.value,
					},
					legend: {
						show: false,
					},
				});

				chart.value.render();
				isLoading.value = false;

			} catch(error: any) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				hasError.value = true;
				isLoading.value = false;
			};
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

<style scoped>
.funnnel-chart {
	height: 100%;
	padding: 12px;
}

.funnnel-chart.has-header {
	padding: 0 12px;
}

</style>
<style>
.funnel-tooltip {
	padding: 12px;
	line-height: 1.2;
}

.funnel-tooltip strong {
	color: var(--theme--primary);
}
</style>