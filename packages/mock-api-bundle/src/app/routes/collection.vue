<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { COLLECTIONS, ENDPOINTS } from '../../shared/tables';
import MockNavigation from '../components/mock-navigation.vue';
import TestRequest from '../components/test-request.vue';
import { useMockApi } from '../composables/use-mock-api';
import { methodKind, statusKind } from '../utils/kinds';

const props = defineProps<{ collectionId: string }>();

const router = useRouter();
const { api, collections, load, refresh, servedAt, notify, errorMessage, failedValidations, setupError } = useMockApi();

const isNew = computed(() => props.collectionId === '+');
const collection = computed(() => collections.value.find((c) => String(c.id) === props.collectionId) ?? null);

const endpoints = ref<any[]>([]);
const loadingEndpoints = ref(false);

const drawerOpen = ref(false);
const edits = ref<Record<string, any>>({});
const saving = ref(false);
const validationErrors = ref<Record<string, unknown>[]>([]);
const confirmDelete = ref(false);

const headers = [
	{ text: 'Method', value: 'method', width: 110 },
	{ text: 'Name', value: 'name', width: 240 },
	{ text: 'Served at', value: 'path', width: 360 },
	{ text: 'Active response', value: 'active', width: 220 },
	{ text: 'Delay', value: 'delay', width: 100 },
];

async function fetchEndpoints() {
	if (isNew.value || !collection.value) return;
	loadingEndpoints.value = true;

	try {
		const response = await api.get(`/items/${ENDPOINTS}`, {
			params: {
				filter: { collection: { _eq: collection.value.id } },
				fields: [
					'id',
					'name',
					'method',
					'path',
					'query',
					'delay',
					'active_response.name',
					'active_response.status',
					'responses.name',
					'responses.status',
					'responses.sort',
				],
				sort: ['sort', 'id'],
				limit: -1,
			},
		});

		endpoints.value = response.data.data;
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
	finally {
		loadingEndpoints.value = false;
	}
}

function activeResponse(item: any) {
	return item.active_response ?? item.responses?.[0] ?? null;
}

async function saveCollection() {
	saving.value = true;
	validationErrors.value = [];

	try {
		if (isNew.value) {
			const response = await api.post(`/items/${COLLECTIONS}`, edits.value);
			await refresh();
			notify('Collection created');
			edits.value = {};
			router.replace(`/mock-api/${response.data.data.id}`);
		}
		else {
			await api.patch(`/items/${COLLECTIONS}/${collection.value!.id}`, edits.value);
			await refresh();
			notify('Collection saved');
			edits.value = {};
			drawerOpen.value = false;
		}
	}
	catch (error) {
		validationErrors.value = failedValidations(error);
		if (validationErrors.value.length === 0) notify(errorMessage(error), 'error');
	}
	finally {
		saving.value = false;
	}
}

async function deleteCollection() {
	try {
		await api.delete(`/items/${COLLECTIONS}/${collection.value!.id}`);
		confirmDelete.value = false;
		drawerOpen.value = false;
		await refresh();
		notify('Collection deleted');
		router.replace('/mock-api');
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
}

watch(
	() => props.collectionId,
	async () => {
		await load();
		edits.value = {};
		validationErrors.value = [];
		await fetchEndpoints();
	},
	{ immediate: true },
);
</script>

<template>
	<private-view
		:title="isNew ? 'Creating collection' : (collection?.name ?? 'Mock API')"
		:icon="isNew ? undefined : 'folder_open'"
		:show-back="isNew"
		@back="router.back()"
	>
		<template #navigation>
			<MockNavigation />
		</template>

		<template #actions>
			<template v-if="isNew">
				<v-button
					v-tooltip.bottom="'Save'"
					icon
					:loading="saving"
					:disabled="!edits.name || !edits.prefix"
					@click="saveCollection"
				>
					<v-icon name="check" />
				</v-button>
			</template>
			<template v-else-if="collection">
				<v-button v-tooltip.bottom="'Collection settings'" icon secondary @click="drawerOpen = true">
					<v-icon name="settings" />
				</v-button>
				<v-button v-tooltip.bottom="'Create endpoint'" icon :to="`/mock-api/${collection.id}/+`">
					<v-icon name="add" />
				</v-button>
			</template>
		</template>

		<div class="content">
			<v-notice v-if="setupError" type="danger">
				{{ setupError }}
			</v-notice>

			<template v-else-if="isNew">
				<v-form v-model="edits" :collection="COLLECTIONS" primary-key="+" :validation-errors="validationErrors" />
			</template>

			<template v-else-if="collection">
				<div class="bar">
					<span class="count">{{ endpoints.length }} {{ endpoints.length === 1 ? 'endpoint' : 'endpoints' }}</span>
					<v-chip small :class="collection.enabled ? 'on' : 'off'">
						{{ collection.enabled ? 'Answering requests' : 'Switched off' }}
					</v-chip>
				</div>

				<v-info v-if="!loadingEndpoints && endpoints.length === 0" icon="api" title="No endpoints yet" center>
					Create an endpoint to start answering requests under {{ servedAt(collection.prefix) }}.
					<template #append>
						<v-button :to="`/mock-api/${collection.id}/+`">
							Create endpoint
						</v-button>
					</template>
				</v-info>

				<v-table
					v-else
					:headers="headers"
					:items="endpoints"
					:loading="loadingEndpoints"
					fixed-header
					@click:row="({ item }: any) => router.push(`/mock-api/${collection!.id}/${item.id}`)"
				>
					<template #[`item.method`]="{ item }">
						<v-chip x-small :kind="methodKind(item.method)" class="method">
							{{ item.method }}
						</v-chip>
					</template>
					<template #[`item.path`]="{ item }">
						<span class="mono">
							{{ servedAt(collection.prefix, item.path) }}{{ item.query ? `?${item.query}` : '' }}
						</span>
					</template>
					<template #[`item.active`]="{ item }">
						<template v-if="activeResponse(item)">
							<v-chip x-small :kind="statusKind(activeResponse(item).status)">
								{{ activeResponse(item).status }}
							</v-chip>
							<span class="subdued">{{ activeResponse(item).name }}</span>
						</template>
						<span v-else class="subdued">No responses</span>
					</template>
					<template #[`item.delay`]="{ item }">
						<span class="subdued">{{ item.delay ?? 0 }} ms</span>
					</template>
				</v-table>
			</template>

			<v-info v-else icon="api" title="Mock API" center>
				Create a collection to group mock endpoints under one URL prefix.
				<template #append>
					<v-button to="/mock-api/+">
						New collection
					</v-button>
				</template>
			</v-info>
		</div>

		<v-drawer
			v-if="collection"
			v-model="drawerOpen"
			:title="collection.name"
			icon="folder_open"
			@cancel="drawerOpen = false"
		>
			<template #actions>
				<v-button v-tooltip.bottom="'Delete'" icon secondary class="delete" @click="confirmDelete = true">
					<v-icon name="delete" />
				</v-button>
				<v-button
					v-tooltip.bottom="'Save'"
					icon
					:loading="saving"
					:disabled="Object.keys(edits).length === 0"
					@click="saveCollection"
				>
					<v-icon name="check" />
				</v-button>
			</template>
			<div class="drawer-content">
				<v-form
					v-model="edits"
					:collection="COLLECTIONS"
					:primary-key="collection.id"
					:initial-values="collection"
					:validation-errors="validationErrors"
				/>
			</div>
		</v-drawer>

		<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
			<v-card>
				<v-card-title>Delete "{{ collection?.name }}"?</v-card-title>
				<v-card-text>
					This deletes the collection and all of its endpoints and responses. It can't be undone.
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">
						Cancel
					</v-button>
					<v-button kind="danger" @click="deleteCollection">
						Delete
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<sidebar-detail v-if="collection" id="mock-api-collection-info" icon="info" title="Collection">
				<dl class="info">
					<dt>Base URL</dt>
					<dd class="mono">
						{{ servedAt(collection.prefix) }}
					</dd>
					<dt>Description</dt>
					<dd>{{ collection.description || 'None' }}</dd>
				</dl>
			</sidebar-detail>
			<TestRequest
				v-if="collection"
				:default-path="servedAt(collection.prefix, endpoints[0]?.path ?? '')"
				:default-method="endpoints[0]?.method ?? 'GET'"
			/>
		</template>
	</private-view>
</template>

<style scoped>
.content {
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
}

.drawer-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-block-end: 16px;
}

.count,
.subdued {
	color: var(--theme--foreground-subdued);
}

.subdued {
	margin-inline-start: 6px;
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
}

.method {
	font-family: var(--theme--fonts--monospace--font-family);
}

.on {
	--v-chip-background-color: var(--theme--success-background, var(--theme--background-normal));
	--v-chip-color: var(--theme--success);
}

.off {
	--v-chip-color: var(--theme--foreground-subdued);
}

.delete {
	--v-button-background-color: var(--theme--danger-background, var(--theme--background-normal));
	--v-button-color: var(--theme--danger);
}

.info {
	display: grid;
	gap: 4px;
	margin: 0;
}

.info dt {
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	font-size: 12px;
}

.info dd {
	margin: 0 0 8px;
	word-break: break-all;
}
</style>
