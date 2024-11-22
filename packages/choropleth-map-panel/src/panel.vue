<template>
	<div class="map-panel" :class="{ 'has-header': showHeader }">
		<v-info type="danger" icon="error" :center="true" v-if="!collection" title="No Collection Selected"></v-info>
		<v-info type="warning" icon="warning" :center="true" v-else-if="!aggregateField" title="No Aggregate Field Selected"></v-info>
		<v-info type="danger" icon="error" :center="true" v-else-if="!canRead" title="Forbidden">You do not have permissions to see this map</v-info>
		<v-info type="danger" icon="error" v-else-if="hasError" :title="errorResponse?.title">{{ errorResponse?.message }}</v-info>
		<VProgressLinear
			v-else-if="isLoading"
			:colorful="false"
			:absolute="true"
			:indeterminate="true"
			:bottom="true"
			:rounded="true"
			:fixed="false"
		/>
		<svg v-show="!hasError" ref="container"></svg>
		<Teleport to="body">
			<div class="top tooltip" ref="tooltip">test</div>
		</Teleport>
	</div>
</template>

<script lang="ts" setup>

	import { useApi, useStores } from '@directus/extensions-sdk';
	import {
		geoMercator, 
		geoPath,
		extent, 
		json, 
		select, 
		scaleLinear, 
		rgb, 
		interpolateHcl,
		color as d3Color
	} from 'd3';
	import { onMounted, ref, watch } from 'vue';
	import { feature } from 'topojson-client'

	var container = ref();
	var tooltip = ref();

	var props = withDefaults(defineProps<{
		showHeader: boolean,
		text: string,
		collection: string,
		countryField: string,
		aggregateField: string,
		aggregateFunction: string,
		filter: object,
		color: string
	}>(), {
		showHeader: false
	});

	const api = useApi();
	const { usePermissionsStore } = useStores();
	const { hasPermission } = usePermissionsStore();
	const canRead = hasPermission(props.collection, 'read');

	const hasError = ref<boolean>(false);
	const isLoading = ref<boolean>(true);
	const errorResponse = ref<Record<string, String>>({
		title: '',
		message: '',
	});

	const getStyleVar = (name:string) => getComputedStyle(document.querySelector("#app") as Element).getPropertyValue(name)

	const width = () => {
		return container.value?.parentNode?.clientWidth ?? 500
	};

	const height = () => {
		return container.value?.parentNode?.clientHeight ?? 300
	};

	var countryCodes;
	var countryData;
	var countries;
	var svg;
	var data;

	const findCountryById = (countryValue) => {
		return countryCodes.find(c => (c['country-code'] == countryValue || c['name'] == countryValue || c['alpha-2'].toUpperCase() == countryValue.toUpperCase() || c['alpha-3'].toUpperCase() == countryValue.toUpperCase()))
	}

	const renderMap = async () => {
		svg = select(container.value)
			.attr("width", width())
			.attr("height", height())
			.attr("viewBox", [0,0,width(),height()])

		countryCodes = await json("https://cdn.jsdelivr.net/gh/lukes/ISO-3166-Countries-with-Regional-Codes@master/all/all.json");
		countryData = await json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json")

		countries = feature(countryData, countryData.objects.countries);

		const projection = geoMercator()
		projection.fitSize([width(),height()], {
			type: "Polygon",
			coordinates: [[ 
				[-175.999,84], 
				[-175.999,-57], 
				[175.999,-57], 
				[175.999,84], 
				[-175.999,84] 
			]]
		})
		const path = geoPath(projection);

		var startColor = d3Color(props.color ?? getStyleVar('--primary'))!;
		startColor.opacity = 0.1;

		svg.append("g")
			.selectAll("path")
			.attr("class", "country")
			.data(countries.features.filter(d => d.id !== "010"))
			.join("path")
				.attr("fill", startColor)
				.attr("d", path)
	}

	const updateMap = async () => {
		if (!svg || !data) return;

		svg
			.attr("width", width())
			.attr("height", height())
			.attr("viewBox", [0,0,width(),height()])

		const projection = geoMercator()
		projection.fitSize([width(),height()], {
			type: "Polygon",
			coordinates: [[ 
				[-175.999,84], 
				[-175.999,-57], 
				[175.999,-57], 
				[175.999,84], 
				[-175.999,84] 
			]]
		})
		
		const path = geoPath(projection);

		var startColor = d3Color(props.color ?? getStyleVar('--primary'))!;
		startColor.opacity = 0.1;

		var dataExtent = extent(data.values());

		const color = scaleLinear()
			.domain([Math.min(dataExtent[0], 0), dataExtent[1]])
			.interpolate(interpolateHcl)
			.range([startColor.rgb(), rgb(props.color ?? getStyleVar('--primary'))]);

		svg
			.selectAll("path")
			.data(countries.features.filter(d => d.id !== "010"))
			.join("path")
				.attr("fill", d => color(data.get(d.id) ?? 0))
				.attr("d", path)
				.on('mouseover', (e,d) => {
					var c = findCountryById(d.id);
					if (!tooltip.value.classList.contains('visible')) {
						tooltip.value.classList.add('visible');
					}
					select(tooltip.value)
						.style('transform', 'translate(-50%, -100%)')
						.style('pointer-events', 'none')
						.text(c.name + ": "+ (data.get(d.id) ?? 'N/A'))
				})
				.on('mousemove', (e,d) => {
					select(tooltip.value)
						.style('left', (e.pageX)+'px')
						.style('top', (e.pageY-5)+'px');
				})
				.on('mouseout', () => {
					tooltip.value.classList.remove('visible');
				})
	};

	const fetchData = async () => {
		if (!props.collection) return;
		hasError.value = false;
		isLoading.value = true;

		try {
			var newData = [];
			var limit = 25;
			var lastNumberOfItems = limit;
			var page = 1;

			while (lastNumberOfItems == limit) {
				const response = await api.get(`/items/${props.collection}`, {
					params: {
						page: page,
						limit: limit,
						filter: props.filter,
						groupBy: props.countryField,
						aggregate: {
							[props.aggregateFunction]: props.aggregateField
						}
					}
				})
				newData = newData.concat(response.data.data.map(entry => {
					var countryValue = String(entry[props.countryField]);
					var c = findCountryById(countryValue)
					if (c) {
						return [c['country-code'], entry?.[props.aggregateFunction]?.[props.aggregateField] ? parseFloat(entry[props.aggregateFunction][props.aggregateField]) : 0];
					}
					return null;
				}).filter(entry => entry !== null));
				lastNumberOfItems = response.data?.data?.length;
				page++;
			}
			data = new Map(newData);
		} catch (ex) {
			errorResponse.value = {
				title: "An error occured",
				message: ex.message
			}
			hasError.value = true;
			console.error(ex);
		}
		isLoading.value = false;
	}

	watch(props, async () => {
		await fetchData();
		await updateMap();
	})

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
	})

</script>

<style scoped>

	.map-panel {
		position: absolute;
		top: 12px;
		right: 12px;
		bottom: 12px;
		left: 12px;
	}

</style>
