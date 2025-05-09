<script setup lang="ts">
import type { CollectionFilters, RelatedItem, RelatedItemObject } from '../types';
import { useApi } from '@directus/extensions-sdk';
// @ts-expect-error unknown error with format-title
import { formatTitle } from '@directus/format-title';
import { abbreviateNumber, getEndpoint } from '@directus/utils';
import { onMounted, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps<{
	collection: string;
	primaryKey: number | string;
}>();

const loading = ref<boolean>(true);
const error = ref<boolean>(false);

const api = useApi();
const { t, te } = useI18n();
const router = useRouter();

const { collection, primaryKey } = toRefs(props);
const relatedItems = ref<RelatedItemObject[]>([]);
const collections = ref<Record<string, CollectionFilters>>({});
const totalItemCount = ref<number>(0);
const editModalActive = ref(false);
const currentlyEditing = ref<string | number | null>(null);
const editingCollection = ref<string | null>(collection.value);
const editsAtStart = ref<Record<string, any>>();
const filterCollection = ref<string>('all');
const page = ref<number>(1);
const limit = ref<number>(10);

const systemEditable = ['directus_files', 'directus_permissions', 'directus_policies', 'directus_roles', 'directus_users'];
const systemNavigate = ['directus_flows', 'directus_presets', 'directus_dashboards'];

async function refreshList(): Promise<boolean> {
	if (primaryKey.value === '+')
		return false;
	loading.value = true;

	// Reset variables
	relatedItems.value = [];
	collections.value = {};
	totalItemCount.value = 0;

	try {
		const response = await api.get(`/related-items/${collection.value}/${primaryKey.value}`);

		response.data.forEach((d: RelatedItem) => {
			if (!(d.collection in collections.value)) {
				collections.value[d.collection] = {
					collection: d.collection,
					name: '',
					item_count: 0,
				};
			}

			// @ts-expect-error index defined above
			collections.value[d.collection].item_count += d.items.length;

			d.items.forEach((i: Record<string, any>) => {
				relatedItems.value.push({
					collection: d.collection,
					disabled: d.collection.includes('directus_') && ![...systemEditable, ...systemNavigate].includes(d.collection),
					field: d.field,
					relation: d.relation,
					fields: d.fields,
					template: d.template?.includes('{{ collection }}') ? d.template?.replace('{{ collection }}', collectionName(i.collection, 'plural')) : d.template,
					item_id: d.relation === 'm2m' && d.junction_field ? i[d.junction_field][d.primary_key] : i[d.primary_key],
					data: d.relation === 'm2m' && d.junction_field ? i[d.junction_field] : i,
				});

				totalItemCount.value++;
			});
		});

		loading.value = false;
		return true;
	}
	catch (error_) {
		console.warn(error_);
		error.value = true;
		return false;
	}
}

function collectionName(collection: string, type: 'singular' | 'plural' = 'singular') {
	if (type === 'singular' && te(`collection_names_singular.${collection}`)) {
		return t(`collection_names_singular.${collection}`);
	}

	if (type === 'plural' && te(`collection_names_plural.${collection}`)) {
		return t(`collection_names_plural.${collection}`);
	}

	return formatTitle(collection.replace('directus_', ''));
}

function startEditing(itemKey: string | number, collection: string) {
	if (collection.includes('directus_') && !systemEditable.includes(collection)) {
		if (['directus_flows', 'directus_presets'].includes(collection)) {
			router.push(`/settings/${collection.replace('directus_', '')}/${itemKey}`);
		}
		else if (collection === 'directus_dashboards') {
			router.push(`/insights/${itemKey}`);
		}

		return;
	}

	editModalActive.value = true;
	editingCollection.value = collection;
	currentlyEditing.value = itemKey;
}

function cancelEdit() {
	editModalActive.value = false;
	editsAtStart.value = undefined;
	currentlyEditing.value = null;
}

async function saveEdits(item: Record<string, any>) {
	if (!editingCollection.value) return;

	try {
		await api.patch(`${getEndpoint(editingCollection.value)}/${currentlyEditing.value}`, item);
	}
	catch (error) {
		console.warn(error);
	}

	cancelEdit();

	await refreshList();
}

onMounted(async () => {
	await refreshList();
});
</script>

<template>
	<template v-if="loading">
		<v-skeleton-loader type="block-list-item-dense"	/>
	</template>

	<template v-else-if="error">
		<v-notice type="danger">
			{{ t('errors.INTERNAL_SERVER_ERROR') }}
		</v-notice>
	</template>

	<template v-else-if="totalItemCount === 0">
		<v-notice>{{ t('no_items') }}</v-notice>
	</template>

	<template v-else>
		<div class="collection-filter">
			<v-chip :label="false" clickable :class="filterCollection === 'all' ? 'active' : ''" @click="filterCollection = 'all'">
				All <span class="item-count">{{ totalItemCount >= 1_000 ? abbreviateNumber(totalItemCount, 1) : totalItemCount }}</span>
			</v-chip>
			<template v-for="item in collections" :key="item.collection">
				<v-chip v-if="item.item_count > 0" :label="false" clickable :class="filterCollection === item.collection ? 'active' : ''" @click="filterCollection = item.collection, page = 1">
					{{ collectionName(item.collection, 'plural') }} <span class="item-count">{{ item.item_count >= 1_000 ? abbreviateNumber(item.item_count, 1) : item.item_count }}</span>
				</v-chip>
			</template>
		</div>
		<v-list-item
			v-for="item in relatedItems.filter(i => (i.collection === filterCollection || filterCollection === 'all') && i.data).slice(limit * (page - 1), limit * page)"
			:key="item.item_id"
			:class="item.disabled ? 'disabled' : ''"
			block
			:dense="totalItemCount > 4"
			clickable
			@click="startEditing(item.item_id, item.collection)"
		>
			<span v-if="filterCollection === 'all'" class="collection">{{ collectionName(item.collection) }}:&nbsp;</span>

			<render-template
				:collection="item.collection"
				:fields="item.fields"
				:template="item.template"
				:item="item.data"
			/>

			<div class="spacer" />

			<v-chip v-if="'date_created' in item.data" class="date-created" x-small>
				<render-template
					:collection="item.collection"
					:fields="item.fields"
					template="{{ date_created }}"
					:item="item.data"
				/>
			</v-chip>
			<v-chip v-if="'timestamp' in item.data" class="date-created" x-small>
				<render-template
					:collection="item.collection"
					:fields="item.fields"
					template="{{ timestamp }}"
					:item="item.data"
				/>
			</v-chip>
			<v-chip v-if="item.collection === 'directus_files' && item.data.type" class="file-type" x-small>
				{{ item.data.type }}
			</v-chip>
			<v-chip v-if="item.collection === 'directus_panels' && item.data.dashboard?.name" class="file-type" x-small>
				{{ formatTitle(item.data.dashboard.name) }}
			</v-chip>
			<v-chip v-if="item.field" class="field" x-small>
				{{ formatTitle(item.field) }}
			</v-chip>
			<v-chip v-if="item.relation" class="relation" x-small>
				{{ item.field === 'item' ? 'M2A' : formatTitle(item.relation) }}
			</v-chip>

			<div class="item-actions">
				<!-- placeholder for actions -->
			</div>
		</v-list-item>
		<v-pagination
			v-if="(filterCollection === 'all' && totalItemCount >= 10) || (filterCollection !== 'all' && (collections[filterCollection]?.item_count ?? 10) >= 10)"
			v-model="page"
			:length="Math.ceil(((filterCollection === 'all' ? totalItemCount : collections[filterCollection]?.item_count) ?? 10) / limit)"
			:total-visible="4"
			show-first-last
		/>
	</template>

	<drawer-item
		:active="!!editModalActive"
		:collection="editingCollection"
		:primary-key="currentlyEditing ?? '+'"
		:edits="editsAtStart"
		@input="saveEdits"
		@update:active="cancelEdit"
	/>
</template>

<style scoped>
  .disabled {
	color: var(--theme--foreground-subdued);
}

.collection {
	color: var(--theme--primary);
	font-weight: bold;
	white-space: nowrap;
}

.disabled .collection {
	color: var(--theme--primary-subdued);
}

.collection-filter {
	margin-bottom: 0.25em;
}

.collection-filter .v-chip {
	margin-right: 0.5em;
	margin-bottom: 0.5em;
}

.collection-filter .v-chip .item-count {
	display: inline-block;
	min-width: 2em;
	margin-left: 0.5em;
	padding: 0.5em;
	border-radius: 1em;
	background-color: var(--theme--background-accent);
	color: var(--theme--foreground-subdued);
	font-weight: bold;
	font-size: 0.8em;
	line-height: 1;
	text-align: center;
}

.collection-filter .v-chip.active {
	background-color: var(--theme--primary-accent);
	border-color: var(--theme--primary-accent);
	color: var(--white);
}

.collection-filter .v-chip:hover {
	border-color: var(--theme--primary-accent) !important;
}

.collection-filter .v-chip:hover .item-count, .collection-filter .v-chip.active .item-count {
	background-color: var(--theme--primary);
	color: var(--white);
}

.v-chip.file-type, .v-chip.date-created, .v-chip.field {
	margin-right: 0.5em;
}

.v-pagination {
	margin-top: 0.75em;
}
</style>
