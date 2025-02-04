<script lang="ts" setup>
import { useApi, useStores } from '@directus/extensions-sdk';
import {
	color as d3Color,
	extent,
	geoMercator,
	geoPath,
	interpolateHcl,
	json,
	rgb,
	scaleLinear,
	select,
} from 'd3';
import { feature } from 'topojson-client';
import { onMounted, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
	showHeader: boolean;
	text: string;
	collection: string;
	countryField: string;
	aggregateField: string;
	aggregateFunction: string;
	filter: object;
	color: string;
}>(), {
	showHeader: false,
});

const container = ref();
const tooltip = ref();

const api = useApi();
const { usePermissionsStore } = useStores();
const { hasPermission } = usePermissionsStore();
const canRead = hasPermission(props.collection, 'read');

const hasError = ref<boolean>(false);
const isLoading = ref<boolean>(true);

const errorResponse = ref<Record<string, string>>({
	title: '',
	message: '',
});

const getStyleVar = (name: string) => getComputedStyle(document.querySelector('#app') as Element).getPropertyValue(name);

function width() {
	return container.value?.parentNode?.clientWidth ?? 500;
}

function height() {
	return container.value?.parentNode?.clientHeight ?? 300;
}

let countryCodes;
let countryData;
let countries;
let svg;
let data;

function findCountryById(countryValue) {
	return countryCodes.find((c) => (c['country-code'] == countryValue || c.name == countryValue || c['alpha-2'].toUpperCase() == countryValue.toUpperCase() || c['alpha-3'].toUpperCase() == countryValue.toUpperCase()));
}

async function renderMap() {
	svg = select(container.value)
		.attr('width', width())
		.attr('height', height())
		.attr('viewBox', [0, 0, width(), height()]);

	countryCodes = await json('https://cdn.jsdelivr.net/gh/lukes/ISO-3166-Countries-with-Regional-Codes@master/all/all.json');
	countryData = await json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');

	countries = feature(countryData, countryData.objects.countries);

	const projection = geoMercator();

	projection.fitSize([width(), height()], {
		type: 'Polygon',
		coordinates: [[
			[-175.999, 84],
			[-175.999, -57],
			[175.999, -57],
			[175.999, 84],
			[-175.999, 84],
		]],
	});

	const path = geoPath(projection);

	const startColor = d3Color(props.color ?? getStyleVar('--primary'))!;
	startColor.opacity = 0.1;

	svg.append('g')
		.selectAll('path')
		.attr('class', 'country')
		.data(countries.features.filter((d) => d.id !== '010'))
		.join('path')
		.attr('fill', startColor)
		.attr('d', path);
}

async function updateMap() {
	if (!svg || !data)
		return;

	svg
		.attr('width', width())
		.attr('height', height())
		.attr('viewBox', [0, 0, width(), height()]);

	const projection = geoMercator();

	projection.fitSize([width(), height()], {
		type: 'Polygon',
		coordinates: [[
			[-175.999, 84],
			[-175.999, -57],
			[175.999, -57],
			[175.999, 84],
			[-175.999, 84],
		]],
	});

	const path = geoPath(projection);

	const startColor = d3Color(props.color ?? getStyleVar('--primary'))!;
	startColor.opacity = 0.1;

	const dataExtent = extent(data.values());

	const color = scaleLinear()
		.domain([Math.min(dataExtent[0], 0), dataExtent[1]])
		.interpolate(interpolateHcl)
		.range([startColor.rgb(), rgb(props.color ?? getStyleVar('--primary'))]);

	svg
		.selectAll('path')
		.data(countries.features.filter((d) => d.id !== '010'))
		.join('path')
		.attr('fill', (d) => color(data.get(d.id) ?? 0))
		.attr('d', path)
		.on('mouseover', (e, d) => {
			const c = findCountryById(d.id);

			if (!tooltip.value.classList.contains('visible')) {
				tooltip.value.classList.add('visible');
			}

			select(tooltip.value)
				.style('transform', 'translate(-50%, -100%)')
				.style('pointer-events', 'none')
				.text(`${c.name}: ${data.get(d.id) ?? 'N/A'}`);
		})
		.on('mousemove', (e, d) => {
			select(tooltip.value)
				.style('left', `${e.pageX}px`)
				.style('top', `${e.pageY - 5}px`);
		})
		.on('mouseout', () => {
			tooltip.value.classList.remove('visible');
		});
}

async function fetchData() {
	if (!props.collection)
		return;
	hasError.value = false;
	isLoading.value = true;

	try {
		let newData = [];
		const limit = 25;
		let lastNumberOfItems = limit;
		let page = 1;

		while (lastNumberOfItems == limit) {
			const response = await api.get(`/items/${props.collection}`, {
				params: {
					page,
					limit,
					filter: props.filter,
					groupBy: props.countryField,
					aggregate: {
						[props.aggregateFunction]: props.aggregateField,
					},
				},
			});

			newData = newData.concat(response.data.data.map((entry) => {
				const countryValue = String(entry[props.countryField]);
				const c = findCountryById(countryValue);

				if (c) {
					return [c['country-code'], entry?.[props.aggregateFunction]?.[props.aggregateField] ? Number.parseFloat(entry[props.aggregateFunction][props.aggregateField]) : 0];
				}

				return null;
			}).filter((entry) => entry !== null));

			lastNumberOfItems = response.data?.data?.length;
			page++;
		}

		data = new Map(newData);
	}
	catch (ex) {
		errorResponse.value = {
			title: 'An error occured',
			message: ex.message,
		};

		hasError.value = true;
		console.error(ex);
	}

	isLoading.value = false;
}

watch(props, async () => {
	await fetchData();
	await updateMap();
});

onMounted(async () => {
	await renderMap();
	await fetchData();
	await updateMap();

	if (ResizeObserver) {
		const resizeObserver = new ResizeObserver(async (entries) => {
			await updateMap();
		});

		resizeObserver.observe(container.value?.parentNode);
	}
});
</script>

<template>
	<div class="map-panel" :class="{ 'has-header': showHeader }">
		<v-info v-if="!collection" type="danger" icon="error" :center="true" title="No Collection Selected" />
		<v-info v-else-if="!aggregateField" type="warning" icon="warning" :center="true" title="No Aggregate Field Selected" />
		<v-info v-else-if="!canRead" type="danger" icon="error" :center="true" title="Forbidden">
			You do not have permissions to see this map
		</v-info>
		<v-info v-else-if="hasError" type="danger" icon="error" :title="errorResponse?.title">
			{{ errorResponse?.message }}
		</v-info>
		<VProgressLinear
			v-else-if="isLoading"
			:colorful="false"
			:absolute="true"
			:indeterminate="true"
			:bottom="true"
			:rounded="true"
			:fixed="false"
		/>
		<svg v-show="!hasError" ref="container" />
		<Teleport to="body">
			<div ref="tooltip" class="top tooltip">
				test
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.map-panel {
	position: absolute;
	top: 12px;
	right: 12px;
	bottom: 12px;
	left: 12px;
}
</style>
