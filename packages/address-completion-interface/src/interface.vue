<script setup lang="ts">
import type { PropType } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import googleLogoDark from './assets/images/google_on_non_white_hdpi.png';
import googleLogo from './assets/images/google_on_white_hdpi.png';
import { getCurrentLanguage } from './utils/get-current-lang';

interface AutocompleteLocation {
	placeId: string;
	text: string;
	place: google.maps.places.Place;
}

type Coordinates = [number, number];

interface GeoProperties {
	placeId: string;
	displayName: string;
	country: string; // ISO 3166-2
	administrativeArea: string;
	postalCode: string;
	formated: string;
	raw: google.maps.places.AddressComponent[];
	viewport: google.maps.LatLngBounds;
}

interface GeoJsonFeature {
	geometry: {
		coordinates: Coordinates;
		type: 'Point';
	};
	properties: Partial<GeoProperties>;
	type: 'Feature';
}

type MapType = 'hybrid' | 'roadmap' | 'satellite' | 'terrain';

const props = defineProps({
	value: {
		type: Object as PropType<GeoJsonFeature> | null,
		default: null,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	apiKeyGMaps: {
		type: String,
		required: true,
	},
	displayMap: {
		type: Boolean,
		default: true,
	},
	iconLeft: {
		type: String,
		default: null,
	},
	iconRight: {
		type: String,
		default: null,
	},
	autocompleteFetchOptions: {
		type: Object,
		default: () => ({}),
	},
});

const emit = defineEmits<{
	input: [GeoJsonFeature | null];
}>();

const { t } = useI18n();

const results = ref<AutocompleteLocation[]>([]);
const sessionToken = ref<google.maps.places.AutocompleteSessionToken | null>(null);
const searchInput = ref<string | null>(null);
const selectedPlaceId = ref<string | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const searchContainer = ref<HTMLElement | null>(null);
const mapTypeSelectContainer = ref<HTMLElement | null>(null);
const mapControlsContainer = ref<HTMLElement | null>(null);
const hasMounted = ref(false);
const isFullscreen = ref(false);
const mapType = ref<MapType>('roadmap');
const controlsReady = ref(false);

const isDark = document.body.classList.contains('dark');
const lang = getCurrentLanguage();

let placesLibrary: google.maps.PlacesLibrary;
let mapsLibrary: google.maps.MapsLibrary;
let markerLibrary: google.maps.MarkerLibrary;
let map: google.maps.Map;
let marker: google.maps.marker.AdvancedMarkerElement | null = null;

onMounted(async () => {
	const loader = new Loader({
		apiKey: props.apiKeyGMaps,
		libraries: ['places', 'maps', 'marker'],
		version: 'weekly',
	});

	placesLibrary = await loader.importLibrary('places');
	mapsLibrary = await loader.importLibrary('maps');
	markerLibrary = await loader.importLibrary('marker');

	setNewSessionToken();
	initMap();
	hasMounted.value = true;
});

onUnmounted(() => {
	if (map) {
		google.maps.event.clearListeners(map, 'tilesloaded');
	}
});

watch(() => props.value, (newValue) => {
	if (!hasMounted.value) {
		return;
	}

	if (!newValue) {
		if (marker) {
			marker.map = null;
		}

		searchInput.value = null;

		return;
	}

	setMapValue();
});

function setNewSessionToken() {
	sessionToken.value = new placesLibrary.AutocompleteSessionToken();
}

async function onInput(value: string) {
	searchInput.value = value;
	makeAutocompleteRequest();
}

async function makeAutocompleteRequest() {
	if (!searchInput.value) {
		results.value = [];
		return;
	}

	const request = {
		input: searchInput.value,
		sessionToken: sessionToken.value!,
		language: lang,
	};

	try {
		const { suggestions } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({ ...request, ...props.autocompleteFetchOptions });

		// Make sure to return a custom object, as the original object doesn't play well with vues reactivity (e.g the getter functions)
		results.value = suggestions
			.filter((suggestion) => suggestion !== null)
			.map((suggestion) => {
				const placePrediction = suggestion.placePrediction!;

				return {
					placeId: placePrediction.placeId,
					text: placePrediction.text.toString(),
					place: placePrediction.toPlace(),
				};
			});
	}
	catch (error) {
		console.error(error);
	}
}

async function onPlaceSelected(location: AutocompleteLocation) {
	searchInput.value = location.text;
	selectedPlaceId.value = location.placeId;

	const placeData = await location.place.fetchFields({
		fields: ['location', 'displayName', 'addressComponents', 'viewport', 'formattedAddress', 'displayName'],
	});

	const lat = placeData.place.location?.lat();
	const lng = placeData.place.location?.lng();

	if (lat && lng) {
		const location = new google.maps.LatLng(lat, lng);
		setMapLocation(location, placeData.place.viewport);

		const geoData: GeoJsonFeature = {
			geometry: {
				coordinates: [lng, lat],
				type: 'Point',
			},
			properties: {
				placeId: selectedPlaceId.value,
				...getProperties(placeData.place),
			},
			type: 'Feature',
		};

		emit('input', geoData);
	}

	setNewSessionToken();
}

function getProperties(place: google.maps.places.Place): GeoProperties {
	let properties = {} as GeoProperties;

	if (place.addressComponents) {
		const country = getadressComponent(place.addressComponents, 'country', 'shortText');
		const postalCode = getadressComponent(place.addressComponents, 'postal_code', 'longText');
		const administrativeArea = getadressComponent(place.addressComponents, 'administrative_area_level_1', 'longText');

		properties = {
			...properties,
			...(country && { country }),
			...(postalCode && { postalCode }),
			...(administrativeArea && { administrativeArea }),
		};

		properties.raw = place.addressComponents;
	}

	if (place.displayName) {
		properties.displayName = place.displayName;
	}

	if (place.formattedAddress) {
		properties.formated = place.formattedAddress;
	}

	if (properties) {
		properties.viewport = place.viewport!;
	}

	return properties;
}

function getadressComponent(addressComponents: google.maps.places.Place['addressComponents'], type: string, valueKey: string) {
	if (!addressComponents) {
		return;
	}

	const component = addressComponents.filter((address_component) => {
		return address_component.types.includes(type);
	});

	if (component && component[0] && component[0][valueKey]) {
		return component[0][valueKey];
	}
}

function initMap() {
	if (!mapContainer.value) {
		return;
	}

	map = new mapsLibrary.Map(mapContainer.value, {
		center: { lat: 0, lng: 0 },
		zoom: 1,
		keyboardShortcuts: false,
		disableDefaultUI: true,
		mapId: 'DEMO_MAP_ID', // a map ID is required for the new AdvancedMarker, the demo ID is provided by google, @see https://developers.google.com/maps/documentation/javascript/advanced-markers/migration?hl=en
	});

	map.addListener('tilesloaded', () => {
		if (searchContainer.value) {
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchContainer.value);
		}

		if (mapControlsContainer.value) {
			map.controls[google.maps.ControlPosition.LEFT_CENTER].push(mapControlsContainer.value);
		}

		if (mapTypeSelectContainer.value) {
			map.controls[google.maps.ControlPosition.TOP_RIGHT].push(mapTypeSelectContainer.value);
		}

		// Wait to make sure the controls are ready, this prevents a layout shift
		setTimeout(() => {
			controlsReady.value = true;
		}, 75);
	});

	setMapValue();
}

function setMapValue() {
	if (!props.value) {
		return;
	}

	const { geometry, properties } = props.value;

	if (geometry?.coordinates?.[1] && geometry?.coordinates?.[0]) {
		setMapLocation(new google.maps.LatLng(geometry.coordinates[1], geometry.coordinates[0]), properties?.viewport);
	}

	if (properties?.displayName) {
		searchInput.value = properties.displayName;
	}
}

function setMapLocation(location: google.maps.LatLng, viewPort: google.maps.LatLngBounds | null | undefined) {
	if (!map) {
		return;
	}

	_setMapCenter(location, viewPort);
	_setMapMarker(location);
}

function _setMapCenter(location: google.maps.LatLng, viewPort: google.maps.LatLngBounds | null | undefined) {
	map.setCenter(location);

	if (viewPort) {
		map.fitBounds(viewPort);
	}
	else {
		// Create bounds with some padding around the point
		const bounds = new google.maps.LatLngBounds();
		bounds.extend(location);

		const PADDING = 0.01;
		bounds.extend(new google.maps.LatLng(location.lat() + PADDING, location.lng() + PADDING));
		bounds.extend(new google.maps.LatLng(location.lat() - PADDING, location.lng() - PADDING));

		map.fitBounds(bounds);
	}
}

function _setMapMarker(location: google.maps.LatLng) {
	if (marker) {
		marker.map = null;
	}

	marker = new markerLibrary.AdvancedMarkerElement({
		position: location,
		map,
	});
}

function zoomMap(zoomValue: number) {
	map.setZoom(map.getZoom()! + zoomValue);
}

function toggleFullscreen() {
	if (!mapContainer.value?.requestFullscreen || !document.exitFullscreen) {
		return;
	}

	if (isFullscreen.value) {
		document.exitFullscreen();
		isFullscreen.value = false;
		return;
	}

	mapContainer.value.requestFullscreen();
	isFullscreen.value = true;
}

function setMapType(newValue: MapType) {
	mapType.value = newValue;
	map.setMapTypeId(google.maps.MapTypeId[newValue.toUpperCase()]);
}
</script>

<template>
	<template v-if="!props.apiKeyGMaps">
		<VNotice type="warning">
			Please provide a valid Google Maps API key in the interface settings to use this component.
		</VNotice>
	</template>

	<template v-else>
		<!-- Render map first, to reduce content-shift on moving the search-input into the map -->
		<div v-if="props.displayMap">
			<div ref="mapContainer" class="map-container" />

			<div v-show="controlsReady" ref="mapTypeSelectContainer" class="map-type-select-container">
				<VSelect
					class="small"
					:model-value="mapType"
					:items="[
						{
							text: 'Map',
							value: 'roadmap',
						},
						{
							text: 'Satellite',
							value: 'satellite',
						},
						{
							text: 'Hybrid',
							value: 'hybrid',
						},
						{
							text: 'Terrain',
							value: 'terrain',
						},
					]"
					close-on-content-click
					@update:model-value="(newValue) => setMapType(newValue)"
				/>
			</div>

			<div v-show="controlsReady" ref="mapControlsContainer" class="map-controls-container">
				<VButton
					icon
					small
					secondary
					:tooltip="t('zoom')"
					@click="zoomMap(1)"
				>
					<v-icon name="add" />
				</VButton>

				<VButton
					icon
					small
					secondary
					:tooltip="t('zoom')"
					@click="zoomMap(-1)"
				>
					<v-icon name="remove" />
				</VButton>

				<VButton
					icon
					small
					secondary
					class="map-controls-fullscreen"
					:tooltip="t('wysiwyg_options.fullscreen')"
					@click="toggleFullscreen"
				>
					<v-icon :name="isFullscreen ? 'fullscreen_exit' : 'fullscreen'" />
				</VButton>
			</div>
		</div>

		<div v-show="mapContainer && controlsReady || !mapContainer" ref="searchContainer" class="search-container">
			<v-menu attached :disabled="disabled">
				<template #activator="{ activate }">
					<v-input
						:placeholder="t('search')"
						:model-value="searchInput"
						:disabled="disabled"
						:small="props.displayMap ? true : false"
						@update:model-value="onInput"
						@focus="activate"
					>
						<template v-if="iconLeft" #prepend>
							<v-icon :name="iconLeft" />
						</template>

						<template v-if="iconRight" #append>
							<v-icon :name="iconRight" />
						</template>
					</v-input>
				</template>

				<v-list v-if="results.length > 0">
					<v-list-item
						v-for="result of results"
						:key="result.placeId"
						:class="selectedPlaceId === result.placeId ? 'selected' : ''"
						@click="() => onPlaceSelected(result)"
					>
						{{ result.text }}
					</v-list-item>

					<!--
						If we do not display the map, we need to include the google logo in here
						@see https://developers.google.com/maps/documentation/javascript/place-autocomplete-data
						@see https://developers.google.com/maps/documentation/javascript/policies#logo
					-->
					<v-list-item
						v-if="!props.displayMap"
						:clickable="false"
						disabled
						class="google-logo"
					>
						<img :src="isDark ? googleLogoDark : googleLogo" alt="Google Logo">
					</v-list-item>
				</v-list>
			</v-menu>
		</div>
	</template>
</template>

<style lang="scss" scoped>
:deep(.v-select) {
	/*
	Small style in sync with input-small
	@see https://github.com/directus/directus/blob/28aaf739ba75980f4cb5ed1fa8c31b900dd97765/app/src/components/v-input.vue#L434-L440
	*/
	&.small {
		.v-input {
			height: 38px;

			.input {
				padding: 8px 12px;
			}
		}
	}
}

:deep(.v-button.secondary) {
	button {
		background-color: var(--theme--form--field--input--background);
	}
}

.v-list {
	.v-list-item {
		&.selected,
		&:hover {
			background-color: var(
				--v-list-item-background-color-active,
				var(--v-list-background-color-active, var(--theme--background-normal))
			);
		}

		&.google-logo {
			&:hover {
				background-color: transparent;
			}

			img {
				height: 1.25rem;
			}
		}
	}
}

.map-container {
	height: 500px;
	width: 100%;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	.search-container,
	.map-type-select-container,
	.map-controls-container {
		margin: 10px;
		font-size: 15px; /* Align with the #main-content base font-size */
	}

	.search-container {
		width: calc(70% - 20px);
		left: 0 !important;
	}

	.map-type-select-container {
		width: calc(30% - 20px);
		right: 0 !important;
	}

	.map-controls-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		left: 0 !important;
		top: 60px !important;

		.map-controls-fullscreen {
			margin-top: 1rem;
		}
	}
}
</style>
