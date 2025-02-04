<script lang="ts" setup>
import { debounce } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useClipboard } from './clipboard';
import { YouTubeHelper } from './youtube';

const props = defineProps<{
	apiKey?: string;
	channelId?: string;
	hideSelect?: boolean;
	value?: any;
}>();

const emit = defineEmits(['input']);
const searchTerm = ref('');
const loading = ref(false);
const nextPageToken = ref('');
const items = ref([]);
const selection = ref([]);
const clipboard = useClipboard();
const error = ref('');

const showDrawer = ref(false);

const headers = ref([{
	text: 'Thumbnail',
	value: 'thumbnail',
	sortable: false,
	width: 69,
}, {
	text: 'Name',
	value: 'name',
	sortable: false,
}, {
	text: 'Channel',
	value: 'channel',
	sortable: false,
}, {
	text: 'Published',
	value: 'published',
	sortable: false,
}, {
	text: 'Embed',
	value: 'embed',
	sortable: false,
}]);

const YT = new YouTubeHelper(props.apiKey, props.channelId);

const preview = computed(() => {
	if (props.value) {
		const match = props.value.match(/iframe src="(.*?)" height="(\d+)" width="(\d+)"/i);

		if (match?.length > 1) {
			return {
				src: match[1],
				height: match[2],
				width: match[3],
			};
		}
	}

	return null;
});

function embed(item: any) {
	const height = Math.round(item.snippet?.thumbnails?.medium ? (1280 / item.snippet.thumbnails.medium.width * item.snippet.thumbnails.medium.height) : 720);
	return `<iframe src="https://www.youtube.com/embed/${item.id.videoId}" height="${height}" width="1280" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

async function copyEmbed(item: any) {
	if (await clipboard.copyToClipboard(embed(item))) {
		item.copied = true;
		setTimeout(() => { item.copied = false; }, 2000);
	}
}

function saveEmbed() {
	if (selection.value?.length) {
		emit('input', embed(selection.value[0]));
	}
	else {
		emit('input', null);
	}

	showDrawer.value = false;
}

const videoSearch = debounce(async (value: string) => {
	loading.value = true;
	error.value = '';

	if (!value && !props.channelId) {
		items.value = [];
		nextPageToken.value = '';
	}
	else {
		try {
			const fetchedItems = await YT.getVideos(value);

			if (fetchedItems.error) {}

			items.value = fetchedItems.items;
			nextPageToken.value = fetchedItems.nextPageToken;
		}
		catch (ex: any) {
			items.value = [];
			nextPageToken.value = '';
			error.value = ex.message;
		}
	}

	loading.value = false;
}, 500);

async function loadMore() {
	loading.value = true;
	const fetchedItems = await YT.getVideos(searchTerm.value, nextPageToken.value);
	items.value = (items.value ?? []).concat(fetchedItems.items);
	nextPageToken.value = fetchedItems.nextPageToken;
	loading.value = false;
}

watch(searchTerm, () => {
	videoSearch(searchTerm.value);
});

watch(showDrawer, () => {
	if (props.channelId && !items.value?.length) {
		videoSearch('');
	}
});
</script>

<template>
	<template v-if="!hideSelect && preview">
		<div class="responsive-preview">
			<div class="responsive-placeholder" :style="{ paddingBottom: (`${preview.height / preview.width * 100}%`) }" />
			<iframe :src="preview.src" :height="preview.height" :width="preview.width" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen />
		</div>
	</template>

	<v-drawer v-model="showDrawer" title="Embed YouTube video" @cancel="showDrawer = false">
		<template #actions>
			<v-button v-if="!hideSelect" v-tooltip.bottom="'Save'" icon rounded @click="saveEmbed">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="layout">
			<v-notice v-if="error" type="danger">
				{{ error }}
			</v-notice>
			<v-input v-model="searchTerm" autofocus full-width placeholder="Search YouTube videos...">
				<template #prepend>
					<v-icon
						name="search"
						class="icon-search"
					/>
				</template>
			</v-input>

			<v-table
				ref="table"
				v-model:headers="headers"
				v-model="selection"
				class="table"
				fixed-header
				:show-select="!hideSelect ? 'one' : 'none'"
				:show-resize="true"
				:show-manual-sort="false"
				:items="items"
				:loading="loading"
			>
				<template #item.thumbnail="{ item }">
					<template v-if="item.snippet?.thumbnails?.medium">
						<v-image
							role="presentation"
							:height="item.snippet.thumbnails.medium.height"
							:width="item.snippet.thumbnails.medium.width"
							:src="item.snippet.thumbnails.medium.url"
						/>
					</template>
				</template>
				<template #item.name="{ item }">
					<div v-html="item.snippet.title" />
				</template>
				<template #item.channel="{ item }">
					{{ item.snippet.channelTitle }}
				</template>
				<template #item.published="{ item }">
					<display-datetime type="timestamp" :value="item.snippet.publishedAt" />
				</template>
				<template #item.embed="{ item }">
					<v-input readonly small :model-value="embed(item)">
						<template v-if="clipboard.isCopySupported" #append>
							<v-icon
								v-tooltip.bottom="'Copy'"
								name="content_copy"
								:clickable="!item.copied"
								:color="item.copied ? 'var(--theme--success)' : null"
								@click="copyEmbed(item)"
							/>
						</template>
					</v-input>
				</template>
				<template #footer>
					<div v-if="nextPageToken" class="footer">
						<div class="pagination">
							<v-button secondary :loading="loading" :disabled="loading" @click="loadMore">
								Load more
							</v-button>
						</div>
					</div>
				</template>
			</v-table>
		</div>
	</v-drawer>
	<v-button @click="showDrawer = true">
		Select
	</v-button>
</template>

<style lang="scss" scoped>
.layout {
	display: grid;
	grid-template-columns: 1fr;
	gap: 24px;
	padding: var(--content-padding);
	padding-top: 0;
}

.footer {
	position: sticky;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 32px 0 0;
}

img {
	display: inline-block;
	width: auto;
	height: 100%;
	vertical-align: -30%;
	border-radius: var(--theme--border-radius);
}

.responsive-preview {
	position: relative;
	margin-bottom: 24px;

	iframe {
		position: absolute;
		border: 0;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
}
</style>
