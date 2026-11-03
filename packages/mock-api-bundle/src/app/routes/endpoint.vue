<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';
import { ENDPOINTS, RESPONSES } from '../../shared/tables';
import MockNavigation from '../components/mock-navigation.vue';
import TestRequest from '../components/test-request.vue';
import { useMockApi } from '../composables/use-mock-api';

const props = defineProps<{ collectionId: string; endpointId: string }>();

const router = useRouter();
const { api, collections, load, servedAt, notify, errorMessage, failedValidations, setupError } = useMockApi();

const isNew = computed(() => props.endpointId === '+');
const collection = computed(() => collections.value.find((c) => String(c.id) === props.collectionId) ?? null);

const item = ref<Record<string, any> | null>(null);
const edits = ref<Record<string, any>>({});
const loading = ref(false);
const saving = ref(false);
const validationErrors = ref<Record<string, unknown>[]>([]);
const confirmDelete = ref(false);
const leaveTo = ref<RouteLocationRaw | null>(null);

const hasEdits = computed(() => Object.keys(edits.value).length > 0);
const values = computed(() => ({ ...item.value, ...edits.value }));
const url = computed(() =>
	collection.value
		? servedAt(collection.value.prefix, values.value.path ?? '') + (values.value.query ? `?${values.value.query}` : '')
		: '',
);

const fullUrl = computed(() => {
	const parts = window.location.href.split('/');
	return parts.slice(0, parts.indexOf('admin')).join('/') + url.value;
});

async function copyUrl() {
	try {
		await navigator.clipboard.writeText(fullUrl.value);
		notify('URL copied');
	}
	catch {
		notify("Couldn't copy the URL", 'error');
	}
}

const title = computed(() => (isNew.value ? 'Creating endpoint' : (item.value?.name ?? 'Endpoint')));

async function fetchItem() {
	edits.value = {};
	validationErrors.value = [];

	if (isNew.value) {
		item.value = { method: 'GET', delay: 0 };
		return;
	}

	loading.value = true;

	try {
		const response = await api.get(`/items/${ENDPOINTS}/${props.endpointId}`, { params: { fields: ['*'] } });
		item.value = response.data.data;
	}
	catch (error) {
		notify(errorMessage(error), 'error');
		router.replace(`/mock-api/${props.collectionId}`);
	}
	finally {
		loading.value = false;
	}
}

function captureValidation(error: unknown) {
	validationErrors.value = failedValidations(error);
	if (validationErrors.value.length === 0) notify(errorMessage(error), 'error');
}

async function save() {
	saving.value = true;
	validationErrors.value = [];

	try {
		if (isNew.value) {
			const response = await api.post(`/items/${ENDPOINTS}`, {
				...edits.value,
				collection: Number(props.collectionId),
			});
			edits.value = {};
			notify('Endpoint created');
			router.replace(`/mock-api/${props.collectionId}/${response.data.data.id}`);
		}
		else {
			await api.patch(`/items/${ENDPOINTS}/${props.endpointId}`, edits.value);
			notify('Endpoint saved');
			await fetchItem();
		}
	}
	catch (error) {
		captureValidation(error);
	}
	finally {
		saving.value = false;
	}
}

async function saveAsCopy() {
	saving.value = true;

	try {
		const source = (
			await api.get(`/items/${ENDPOINTS}/${props.endpointId}`, {
				params: { fields: ['*', 'responses.name', 'responses.status', 'responses.body', 'active_response.name'] },
			})
		).data.data;
		const merged = { ...source, ...edits.value };

		const created = (
			await api.post(`/items/${ENDPOINTS}`, {
				collection: Number(props.collectionId),
				name: `${merged.name} (copy)`,
				method: merged.method,
				path: merged.path,
				query: merged.query,
				delay: merged.delay,
				notes: merged.notes,
				responses: source.responses.map((r: any) => ({ name: r.name, status: r.status, body: r.body })),
			})
		).data.data;

		const activeName = source.active_response?.name;

		if (activeName) {
			const match = (
				await api.get(`/items/${RESPONSES}`, {
					params: { filter: { endpoint: { _eq: created.id }, name: { _eq: activeName } }, fields: ['id'], limit: 1 },
				})
			).data.data[0];
			if (match) await api.patch(`/items/${ENDPOINTS}/${created.id}`, { active_response: match.id });
		}

		edits.value = {};
		notify('Saved as copy');
		router.push(`/mock-api/${props.collectionId}/${created.id}`);
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
	finally {
		saving.value = false;
	}
}

async function remove() {
	try {
		await api.delete(`/items/${ENDPOINTS}/${props.endpointId}`);
		edits.value = {};
		confirmDelete.value = false;
		notify('Endpoint deleted');
		router.replace(`/mock-api/${props.collectionId}`);
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
}

function guard(to: RouteLocationRaw) {
	if (!hasEdits.value) return true;
	leaveTo.value = to;
	return false;
}

onBeforeRouteLeave((to) => guard(to.fullPath));
onBeforeRouteUpdate((to) => guard(to.fullPath));

function discardAndLeave() {
	const to = leaveTo.value;
	edits.value = {};
	leaveTo.value = null;
	if (to) router.push(to);
}

watch(
	() => props.endpointId,
	async () => {
		await load();
		await fetchItem();
	},
	{ immediate: true },
);
</script>

<template>
	<private-view :title="title" show-back @back="router.push(`/mock-api/${collectionId}`)">
		<template #headline>
			{{ collection?.name }}
		</template>
		<template #navigation>
			<MockNavigation />
		</template>

		<template #actions>
			<v-button v-if="!isNew" v-tooltip.bottom="'Delete'" icon secondary class="delete" @click="confirmDelete = true">
				<v-icon name="delete" />
			</v-button>
			<v-button v-if="!isNew" v-tooltip.bottom="'Save as copy'" icon secondary :disabled="saving" @click="saveAsCopy">
				<v-icon name="content_copy" />
			</v-button>
			<v-button v-tooltip.bottom="'Save'" icon :loading="saving" :disabled="!hasEdits" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<v-notice v-if="setupError" type="danger">
				{{ setupError }}
			</v-notice>
			<template v-else-if="item">
				<div class="served">
					<v-notice icon="link">
						<span>
							Served at
							<code>{{ url }}</code>
						</span>
						<v-icon v-tooltip="'Copy full URL'" class="copy" name="content_copy" small clickable @click="copyUrl" />
					</v-notice>
				</div>
				<v-form
					v-model="edits"
					:collection="ENDPOINTS"
					:primary-key="isNew ? '+' : endpointId"
					:initial-values="item"
					:loading="loading"
					:validation-errors="validationErrors"
				/>
			</template>
		</div>

		<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
			<v-card>
				<v-card-title>Delete "{{ item?.name }}"?</v-card-title>
				<v-card-text>Requests to this path will stop being answered. This can't be undone.</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">
						Cancel
					</v-button>
					<v-button kind="danger" @click="remove">
						Delete
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog :model-value="leaveTo !== null" @esc="leaveTo = null">
			<v-card>
				<v-card-title>Unsaved changes</v-card-title>
				<v-card-text>You have changes that aren't saved. Leave and discard them?</v-card-text>
				<v-card-actions>
					<v-button secondary @click="leaveTo = null">
						Keep editing
					</v-button>
					<v-button kind="danger" @click="discardAndLeave">
						Discard changes
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<template #sidebar>
			<sidebar-detail id="mock-api-endpoint-info" icon="info" title="Information">
				<dl class="info">
					<dt>Served at</dt>
					<dd class="mono">
						{{ url }}
					</dd>
				</dl>
			</sidebar-detail>
			<TestRequest
				v-if="!isNew && item"
				:default-path="url"
				:default-method="values.method ?? 'GET'"
				:dirty="hasEdits"
			/>
		</template>
	</private-view>
</template>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding-bottom);
}

.served {
	margin-block-end: 48px;
}

.copy {
	margin-inline-start: 8px;
	vertical-align: middle;
}

.served code {
	font-family: var(--theme--fonts--monospace--font-family);
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
}

.delete {
	--v-button-background-color: var(--theme--danger-background, var(--theme--background-normal));
	--v-button-color: var(--theme--danger);
}

.info {
	margin: 0;
}

.info dt {
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	font-size: 12px;
}

.info dd {
	margin: 0;
	word-break: break-all;
}
</style>
