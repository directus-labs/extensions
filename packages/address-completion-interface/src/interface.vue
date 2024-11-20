<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loader } from "@googlemaps/js-api-loader";
import { getCurrentLanguage } from './utils/get-current-lang';

// @ts-ignore
import googleLogo from './assets/images/google_on_white_hdpi.png';
// @ts-ignore
import googleLogoDark from './assets/images/google_on_non_white_hdpi.png';

type AutocompleteLocation = {
	placeId: string,
	text: string,
	place: google.maps.places.Place	,
}

const props = defineProps({
	value: {
		type: String,
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
});

const emit = defineEmits<{
  'input': [string | null],
}>();

const { t } = useI18n();

const results = ref<AutocompleteLocation[]>([]);
const sessionToken = ref<google.maps.places.AutocompleteSessionToken | null>(null);
const searchInput = ref<string | null>(null);
const selectedPlaceId = ref<string | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const searchContainer = ref<HTMLElement | null>(null);

const isDark = document.body.classList.contains('dark');
const lang = getCurrentLanguage();

let places: google.maps.PlacesLibrary;
let maps: google.maps.MapsLibrary;


onMounted( async () => {
	const loader = new Loader({
		apiKey: props.apiKeyGMaps,
		libraries: ['places', 'maps'],
		version: 'weekly',
	});

	places = await loader.importLibrary("places");
	maps = await loader.importLibrary("maps");

	setNewSessionToken();
	initMap();
});


function setNewSessionToken() {
	sessionToken.value = new places.AutocompleteSessionToken();
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
		const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

		// Make sure to return a custom object, as the original object doesn't play well with vues reactivity (e.g the getter functions)
		results.value = suggestions
			.filter((suggestion) => suggestion !== null)
			.map((suggestion) => {
				const placePrediction = suggestion.placePrediction!;
				
				return {
					placeId: placePrediction.placeId,
					text: placePrediction.text.toString(),
					place: placePrediction.toPlace(),
				}
			});
	} catch (error) {
		console.error(error);
	}
}


async function onPlaceSelected(location: AutocompleteLocation) {
	searchInput.value = location.text;
	selectedPlaceId.value = location.placeId;
	setNewSessionToken();
}

// TODO: in case that a locations exist, init it with it
function initMap() {
  if (!mapContainer.value) {
    return;
  }

  const map = new maps.Map(mapContainer.value, {
    center: { lat: 0, lng: 0 },
		zoom: 1,
		streetViewControl: false,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			position: google.maps.ControlPosition.TOP_RIGHT,
		},

	});

	if (searchContainer.value) {
		console.log('Push search container');
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchContainer.value!);
	}
}
</script>


<template>
	<div ref="searchContainer" class="search-container">
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
					:disabled="true" 
					class="google-logo"
				>
					<img :src="isDark ? googleLogoDark : googleLogo" alt="Google Logo" />
				</v-list-item>
			</v-list>
		</v-menu>
	</div>

	<div v-if="props.displayMap">
		<div ref="mapContainer" class="map-container"></div>
	</div>
</template>


<style lang="scss" scoped>
.v-list {
	.v-list-item {
		&.selected,
		&:hover {
			background-color: var(--v-list-item-background-color-active, var(--v-list-background-color-active, var(--theme--background-normal)));
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

	.search-container {
		margin: 10px;
		width: 80%;
	}
}

.search-control {
  margin: 10px;
  min-width: 300px;

  :deep(.v-menu) {
    z-index: 1000;
  }
}

</style>