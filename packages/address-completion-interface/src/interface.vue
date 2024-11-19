<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Loader } from "@googlemaps/js-api-loader"

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

let places: google.maps.PlacesLibrary;


onMounted( async () => {
	const loader = new Loader({
		apiKey: props.apiKeyGMaps,
		libraries: ['places'],
		version: 'weekly',
	});

	places = await loader.importLibrary("places");

	setNewSessionToken();
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
	
</script>


<template>
	<v-menu attached :disabled="disabled">
			<template #activator="{ activate }">
				<v-input
					:placeholder="t('search')"
					:model-value="searchInput"
					:disabled="disabled"
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
			</v-list>
		</v-menu>
</template>


<style lang="scss" scoped>
.v-list {
	.v-list-item {
		&.selected,
		&:hover {
			background-color: var(--v-list-item-background-color-active, var(--v-list-background-color-active, var(--theme--background-normal)));
		}
	}
}

</style>