<template>
	<div class="scatter-plot" :class="{ 'has-header': showHeader }">
		<v-info type="danger" icon="error" :center="true" v-if="!collection" title="No Collection Selected"></v-info>
		<v-info type="warning" icon="warning" :center="true" v-else-if="!xAxis || !yAxis" title="Both Axis must be selected"></v-info>
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
import { abbreviateNumber } from '@directus/utils';
import formatTitle from '@directus/format-title';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import ApexCharts from 'apexcharts'
import { format } from 'date-fns';
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
		series: {
			type: String,
			default: null,
		},
		xAxis: {
			type: String,
			default: null,
		},
		yAxis: {
			type: String,
			default: null,
		},
		color: {
			type: String,
			default: 'var(--theme--primary)',
		},
		showAxisLabels: {
			type: String,
			default: 'both',
		},
		showMarker: {
			type: Boolean,
			default: true,
		},
	},
	setup(props){

		const { t, n } = useI18n();
		const api = useApi();
		const { useFieldsStore, usePermissionsStore } = useStores();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const hasError = ref<boolean>(false);
		const errorResponse = ref<Record<string, String>>({
			title: '',
			message: '',
		});
		const isLoading = ref<boolean>(true);

		const fieldsStore = useFieldsStore();
		const chartEl = ref();
		const chart = ref<ApexCharts>();

		onMounted(setUpChart);

		watch(
			[
				() => props.collection,
				() => props.filter,
				() => props.series,
				() => props.xAxis,
				() => props.yAxis,
				() => props.color,
				() => props.width,
				() => props.height,
				() => props.showAxisLabels,
				() => props.showMarker,
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
			if (!props.xAxis || !props.yAxis) return;

			const xField = fieldsStore.getField(props.collection, props.xAxis);
			const yField = fieldsStore.getField(props.collection, props.yAxis);
			const showToolTip = props.showMarker;
			const type: string = ["timestamp", "dateTime", "date"].includes(xField.type) ? 'datetime' : 'numeric';

			let series: any = [];
			let categories: any = [];

			try{
				const response = await api.get(`/items/${props.collection}`,{
					params: {
						limit: '-1',
						filter: props.filter,
						fields: [props.xAxis, props.yAxis, props.series],
						sort: [props.series, props.xAxis],
					}
				});

				if (props.series) {
					let category_data: Record<string, any> = {};
					response.data.data.forEach((item: Record<string, any>) => {
						const category = formatTitle(get(item, props.series));
						const x_value = get(item, props.xAxis);
						const y_value = get(item, props.yAxis);
						if(!(category in category_data)){
							category_data[category] = [];
						}
						category_data[category].push([type == 'datetime' ? new Date(x_value):String(x_value), y_value]);
					});
					categories = Object.keys(category_data);
					series = categories.map((category: string) => {
						return {
							name: category,
							data: category_data[category],
						};
					});
				} else {
					series = [
						{
							name: formatTitle(props.collection),
							data: response.data.data.map((item: Record<string, any>) => {
								return [get(item, props.xAxis), get(item, props.yAxis)];
							}),
						},
					];
				}

				const isSparkline = props.width < 12 || props.height < 10;

				const axisStyle = {
					fontFamily: 'var(--theme--fonts--sans--font-family)',
					foreColor: 'var(--theme--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				};

				let xLabels: Record<string, any> = {
					show: ['both', 'xAxis'].includes(props.showAxisLabels),
					offsetY: -4,
					style: axisStyle,
				};

				if(type == 'datetime'){
					xLabels.datetimeFormatter = {
						year: 'yyyy',
						month: 'MMM \'yy',
						day: 'dd MMM',
						hour: 'HH:mm'
					};
					xLabels.datetimeUTC = false;
				} else {
					xLabels.formatter = function(val: string) {
						return xField.type == 'integer' ? parseInt(val) : parseFloat(val).toFixed(1);
					};
				}

				chart.value = new ApexCharts(chartEl.value, {
					colors: props.series || props.color == null ? [] : [props.color],
					chart: {
						type: 'scatter',
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
							fill: {
								opacity: 0.5
							},
							stroke: {
								opacity: 0
							},
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
					markers: {
						size: 8,
						fillOpacity: 0.5,
						strokeOpacity: 0,
						hover: {
							size: 8,
						},
					},
					tooltip: {
						enabled: showToolTip,
						x: {
							formatter: (value: any) => {
								let formattedValue = type == 'datetime' ? format(value, (xField.type == 'date' ? "MMM d" : "MMM d, p")) : value > 10000
									? abbreviateNumber(value, 1)
									: n(value, 'decimal', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 2,
									} as any);
								return `${xField.name}: ${formattedValue}`;
							},
						},
						y: {
							formatter: (value: any) => {
								return `${yField.name} ${value}`;
							},
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
								left: 30,
								right: 30,
							},
					},
					xaxis: {
						type: type,
						labels: xLabels,
						tooltip: {
							enabled: false
						},
						crosshairs: {
							stroke: {
								color: 'var(--theme--form--field--input--border-color)',
							},
						},
					},
					yaxis: {
						show: ['both', 'yAxis'].includes(props.showAxisLabels),
						axisBorder: {
							show: true,
						},
						axisTicks: {
							show: true,
						},
						forceNiceScale: true,
						tickAmount: props.height - 4,
						labels: {
							show: ['both', 'yAxis'].includes(props.showAxisLabels),
							formatter: (value: number) => {
								return value > 10000
									? abbreviateNumber(value, 1)
									: n(value, 'decimal', {
											minimumFractionDigits: 0,
											maximumFractionDigits: 2,
									} as any);
							},
							style: axisStyle,
						},
					},
					legend: {
						show: !isSparkline,
						position: 'bottom',
						offsetY: -4,
						markers: {
							width: 8,
							height: 8,
							fillOpacity: 0.5,
						},
						...axisStyle,
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
.scatter-plot {
	height: 100%;
	padding: 12px;
}

.scatter-plot.has-header {
	padding: 0 12px;
}

</style>
