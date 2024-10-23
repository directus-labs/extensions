<template>
	<div class="timeline-chart" :class="{ 'has-header': showHeader }">
		<v-info type="danger" icon="error" :center="true" v-if="!collection" title="No Collection Selected"></v-info>
		<v-info type="warning" icon="warning" :center="true" v-else-if="!datetimeStart || !datetimeEnd" title="Both Axis must be selected"></v-info>
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
import formatTitle from '@directus/format-title';
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import ApexCharts from 'apexcharts'
import { differenceInDays, format } from 'date-fns';
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
		label: {
			type: String,
			default: null,
		},
		datetimeStart: {
			type: String,
			default: null,
		},
		datetimeEnd: {
			type: String,
			default: null,
		},
		task: {
			type: String,
			default: '',
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
				() => props.label,
				() => props.datetimeStart,
				() => props.datetimeEnd,
				() => props.task,
				() => props.series,
				() => props.color,
				() => props.width,
				() => props.height,
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
			if (!props.datetimeStart || !props.datetimeEnd || !props.label) return;

			const showToolTip = props.showMarker;

			let series: any = [];
			let fields: Array<string> = [props.datetimeStart, props.datetimeEnd];

			if(props.label) fields.push(props.label);
			if(props.series) fields.push(props.series);
			if(props.task) fields.push(props.task);

			try{
				const response = await api.get(`/items/${props.collection}`,{
					params: {
						limit: '-1',
						filter: props.filter,
						fields: fields,
						sort: [props.series, props.label, props.datetimeStart],
					}
				});

				let timeline_series_data: Record<string, any> = {};
				let timeline_data: Array<Record<string, any>> = [];
				response.data.data.forEach((item: Record<string, any>) => {
					const x_value = formatTitle(get(item, props.label));
					const y_value = [new Date(get(item, props.datetimeStart)).getTime(), new Date(get(item, props.datetimeEnd)).getTime()];

					if (props.series) {
						const category = formatTitle(get(item, props.series));
						if(!(category in timeline_series_data)){
							timeline_series_data[category] = [];
						}
						timeline_series_data[category].push({
							x: x_value,
							y: y_value,
							task: props.task ? formatTitle(get(item, props.task)) : null,
						});
					} else {
						timeline_data.push({
							x: x_value,
							y: y_value,
							task: props.task ? formatTitle(get(item, props.task)) : null,
						});
					}
				});

				series = props.series ? Object.keys(timeline_series_data).map((category: string) => {
					return {
						name: category,
						data: timeline_series_data[category],
					};
				}) : [
					{
						name: formatTitle(props.collection),
						data: timeline_data,
					},
				];

				const colors = props.series || props.color == null ? {
					colors: [],
					fill: {
						type: 'solid',
						opacity: 0.8,
					},
					stroke: {
						width: 1
					},
				} : {
					colors: [props.color.includes("#") ? `${props.color}AA` : props.color],
					fill: {
						type: 'solid',
						opacity: [0.6],
					},
					stroke: {
						colors: props.color,
						width: 1
					},
				};
				const isSparkline = props.width < 12 || props.height < 10;

				const axisStyle = {
					fontFamily: 'var(--theme--fonts--sans--font-family)',
					foreColor: 'var(--theme--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				};

				chart.value = new ApexCharts(chartEl.value, {
					...colors,
					series: series,
					chart: {
						type: 'rangeBar',
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
						bar: {
							horizontal: true,
						}
					},
					dataLabels: {
						enabled: props.showDataLabel,
						formatter: function(val: Array<Date>, opt: Record<string,any>) {
							var diff: number = differenceInDays(val[1], val[0]);
							var task: string = opt.w.globals.initialSeries[opt.seriesIndex].data[opt.dataPointIndex].task;
							return `${(diff > 7 || diff > task.length ? task : '')} ${diff} ${(diff > 1 ? ' days' : ' day')}`;
						}
					},
					tooltip: {
						enabled: showToolTip,
						custom: function({series, seriesIndex, dataPointIndex, w}) {
							var item: Record<string,any> = w.globals.initialSeries[seriesIndex];
							var data: Record<string,any> = item.data[dataPointIndex];
							var color = w.globals.colors[seriesIndex];
							return '<div class="timeline-tooltip">' +
							`<span><strong>${data.x}${data.task? ': '+data.task:''}</strong></span>` +
							`<br/><span>${format(data.y[0], "d MMM")} - ${format(data.y[1], "d MMM")}</span>` +
							(item?.name ? `<br/><span><span class="timeline-series-circle" style="background-color: ${color};"></span> <em>${item.name}</em></span>` : '') +
							'</div>';
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
						type: 'datetime',
						// labels: xLabels,
						// crosshairs: {
						// 	stroke: {
						// 		color: 'var(--theme--form--field--input--border-color)',
						// 	},
						// },
					},
					yaxis: {
						show: true,
						axisBorder: {
							show: true,
						},
						axisTicks: {
							show: true,
						},
						forceNiceScale: true,
						tickAmount: props.height - 4,
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
.timeline-chart {
	height: 100%;
	padding: 12px;
}

.timeline-chart.has-header {
	padding: 0 12px;
}
</style>
<style>
.timeline-tooltip {
	padding: 12px;
	line-height: 1.2;
}

.timeline-tooltip strong {
	color: var(--theme--primary);
}

.timeline-series-circle {
	display: inline-block;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background-color: var(--theme--primary);
}
</style>