<script setup lang="ts">
import type { Field, Item, PrimaryKey, Relation } from '@directus/types';
import type { Ref } from 'vue';
import type { CollectionFilters, RelatedItem, RelatedItemObject } from '../types';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
// @ts-expect-error unknown error with format-title
import { formatTitle } from '@directus/format-title';
import { abbreviateNumber, getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { computed, inject, onMounted, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { calculateRelation } from '../shared/calculate-relation';
import { getItemRoute } from './utils/get-route';

const props = defineProps<{
	collection: string;
	primaryKey: number | string;
}>();

const { collection, primaryKey } = toRefs(props);

const api = useApi();
const { useFieldsStore, useNotificationsStore, useRelationsStore } = useStores();
const notificationsStore = useNotificationsStore();
const relationsStore = useRelationsStore();
const relations: Relation[] = relationsStore.getRelationsForCollection(collection.value);
const fieldStore = useFieldsStore();
const { fields } = useCollection(collection);
const visibleCollectionFields = computed(() => {
	return fields.value.filter((f) => !f.meta?.hidden && relations.some((r) => f.field === r.meta?.one_field));
});

const { t, te } = useI18n();
const router = useRouter();

const loading = ref<boolean>(true);
const error = ref<boolean>(false);
const relatedItems = ref<RelatedItemObject[]>([]);
const newRelatedItems = ref<Record<string, RelatedItemObject[]>>({});
const deletedRelatedItems = ref<Record<string, PrimaryKey[]>>({});
const templates = ref<Record<string, string>>({});
const editModalActive = ref<boolean>(false);
const editDisabled = ref<boolean>(false);
const currentlyEditing = ref<string | number | null>(null);
const editingCollection = ref<string | null>(collection.value);
const editsAtStart = ref<Record<string, any>>();
const filterCollection = ref<string>('all');
const page = ref<number>(1);
const limit = ref<number>(10);

const values: Ref = inject('values', ref({}));

const systemEditable = ['directus_files', 'directus_permissions', 'directus_policies', 'directus_roles'];
const systemNavigate = ['directus_flows', 'directus_presets', 'directus_dashboards', 'directus_users'];

async function refreshList(): Promise<boolean> {
	if (primaryKey.value === '+') {
		loading.value = false;
		return false;
	}

	loading.value = true;

	relatedItems.value = [];

	try {
		const response = await api.get(`/related-items/${collection.value}/${primaryKey.value}`);

		response.data.forEach((d: RelatedItem) => {
			templates.value[d.collection] = d.template?.includes('{{ collection }}') ? d.template?.replace('{{ collection }}', collectionName(d.collection, 'plural')) : d.template ?? `{{ ${d.primary_key} }}`;
			const junctionPrimaryKey = fieldStore.getPrimaryKeyFieldForCollection(d.relation.collection);

			d.items.forEach((i) => {
				const item_id = ['m2m', 'm2a', 'a2m'].includes(d.type) && d.junction_field ? i[d.junction_field]?.[d.primary_key] : i[d.primary_key];

				relatedItems.value.push({
					primary_key: d.primary_key,
					collection: d.collection,
					disabled: (d.collection.includes('directus_') && ![...systemEditable, ...systemNavigate].includes(d.collection)) || (d.collection === props.collection && item_id === props.primaryKey),
					field: d.field,
					junction_field: d.junction_field,
					junction_id: ['m2m', 'm2a', 'a2m'].includes(d.type) ? i[junctionPrimaryKey.field] : item_id,
					type: d.type,
					fields: d.fields,
					template: templates.value[d.collection],
					item_id,
					data: ['m2m', 'm2a', 'a2m'].includes(d.type) && d.junction_field ? i[d.junction_field] : i,
				});
			});
		});

		loading.value = false;
		return true;
	}
	catch (error_) {
		console.error(error_);
		error.value = true;
		return false;
	}
}

async function fetchDisplayData({ collection, id, fields }: { collection: string; id: PrimaryKey; fields: string[] }): Promise<Item> {
	try {
		const response = await api.get(`${collection.startsWith('directus_') ? collection.replace('directus_', '') : `/items/${collection}`}/${id}?fields=${fields.join(',')}`);
		return response.data.data;
	}
	catch (error_) {
		console.error(error_);
		return {};
	}
}

const collections = computed<Record<string, CollectionFilters>>(() => {
	const collections: Record<string, CollectionFilters> = {};

	[...relatedItems.value.filter((i) => (!i.junction_id || (i.field && i.junction_id && !deletedRelatedItems.value?.[i.field]?.includes(i.junction_id))) && i.data), ...Object.values(newRelatedItems.value).flat()]
		.forEach((d) => {
			if (!(d.collection in collections)) {
				collections[d.collection] = {
					collection: d.collection,
					name: '',
					item_count: 0,
				};
			}

			// @ts-expect-error index defined above
			collections[d.collection].item_count++;
		});

	return collections;
});

const relatedView = computed(() => {
	return [...relatedItems.value, ...Object.values(newRelatedItems.value).flat()]
		.filter((i) => (i.collection === filterCollection.value || filterCollection.value === 'all') && (!i.junction_id || (i.field && i.junction_id && !deletedRelatedItems.value?.[i.field]?.includes(i.junction_id))) && i.data)
		.slice(limit.value * (page.value - 1), limit.value * page.value);
});

const totalItemCount = computed<number>(() => {
	return [...relatedItems.value.filter((i) => (!i.junction_id || (i.field && i.junction_id && !deletedRelatedItems.value?.[i.field]?.includes(i.junction_id))) && i.data), ...Object.values(newRelatedItems.value).flat()].length ?? 0;
});

function collectionName(collection: string, type: 'singular' | 'plural' = 'singular') {
	if (type === 'singular' && te(`collection_names_singular.${collection}`)) {
		return t(`collection_names_singular.${collection}`);
	}

	if (type === 'plural' && te(`collection_names_plural.${collection}`)) {
		return t(`collection_names_plural.${collection}`);
	}

	return formatTitle(collection.replace('directus_', ''));
}

function startEditing(item: RelatedItemObject) {
	if (item.disabled) return;

	if (item.collection.includes('directus_') && !systemEditable.includes(item.collection)) {
		if (['directus_flows', 'directus_presets'].includes(item.collection)) {
			router.push(`/settings/${item.collection.replace('directus_', '')}/${item.item_id}`);
		}
		else if (item.collection === 'directus_dashboards') {
			router.push(`/insights/${item.item_id}`);
		}
		else if (item.collection === 'directus_users') {
			router.push(`/users/${item.item_id}`);
		}

		return;
	}

	editModalActive.value = true;
	editDisabled.value = item.type === 'm2a' || visibleCollectionFields.value.some((f) => f.field === item.field);
	editingCollection.value = item.collection;
	currentlyEditing.value = item.item_id;
	editsAtStart.value = item.data;
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

		notificationsStore.add({
			title: t('item_update_success'),
		});
	}
	catch (error_) {
		console.warn(error_);

		notificationsStore.add({
			title: t('errors.UNKNOWN'),
			type: 'warning',
		});
	}

	cancelEdit();

	await refreshList();
}

onMounted(async () => {
	await refreshList();
});

function updateRelatedItems(item: Item) {
	for (const relatedItem of relatedItems.value) {
		if (relatedItem.junction_field && relatedItem.junction_field in item && relatedItem.item_id === item[relatedItem.junction_field][relatedItem.primary_key!]) {
			const { [relatedItem.primary_key!]: id, ...rest } = item[relatedItem.junction_field];
			relatedItem.data = { ...relatedItem.data, ...rest };
		}
	}
}

async function createRelatedItems(item: Item, field: Field, relation: Relation | undefined): Promise<RelatedItemObject | null> {
	if (!relation || !field) return null;
	const junction_field = relation.meta?.junction_field;
	if (!junction_field) return null;

	const { is_m2a, relationType } = calculateRelation({ relation, collection: collection.value });
	const keys = Object.keys(item[junction_field]);
	const relations = await relationsStore.getRelationsForCollection(relation.collection);
	const related_collection = is_m2a ? item.collection : (relationType === 'm2m' ? relations.find((r: Relation) => r.field === relation.meta?.junction_field).related_collection : relation.related_collection) ?? collection.value;
	const primaryKey = fieldStore.getPrimaryKeyFieldForCollection(related_collection);
	const display_template = templates.value[related_collection] ?? `{{ ${keys[0]} }}`;
	const template_fields = [...getFieldsFromTemplate(display_template).filter((t) => !t.includes('$')), ...(related_collection === 'directus_files' ? ['type'] : [])];
	const item_id = keys.includes(primaryKey.field) ? item[junction_field][primaryKey.field] : null;

	return {
		collection: related_collection,
		disabled: true,
		field: field.field,
		junction_field: junction_field ?? null,
		junction_id: null,
		type: relationType,
		fields: template_fields,
		template: display_template,
		item_id,
		data: item_id ? await fetchDisplayData({ collection: related_collection, id: item_id, fields: template_fields }) : item[junction_field],
	};
}

visibleCollectionFields.value.forEach((f) => {
	watch(() => values.value[f.field], () => {
		deletedRelatedItems.value[f.field] = [];
		newRelatedItems.value[f.field] = [];

		if (values.value?.[f.field] && 'create' in values.value[f.field]) {
			page.value = 1;

			values.value[f.field].update.forEach((u: Item) => {
				updateRelatedItems(u);
			});

			deletedRelatedItems.value[f.field] = values.value[f.field].delete ?? [];

			values.value[f.field].create.forEach(async (u: Item) => {
				const newItem: RelatedItemObject | null = await createRelatedItems(u, f, relations.find((r) => f.field === r.meta?.one_field));

				if (newItem) {
					newRelatedItems.value[f.field]?.push(newItem);
				}
			});
		}
	});
});
</script>

<template>
	<div class="field-label type-label">
		<span class="field-name">
			<div class="v-text-overflow">Related Items</div>
		</span>
	</div>

	<template v-if="primaryKey === '+'">
		<v-notice>Save changes to see any relational items.</v-notice>
	</template>

	<template v-else-if="loading">
		<v-skeleton-loader type="block-list-item-dense"	/>
	</template>

	<template v-else-if="error">
		<v-notice type="danger">
			{{ t('errors.INTERNAL_SERVER_ERROR') }}
		</v-notice>
	</template>

	<template v-else-if="totalItemCount === 0">
		<v-notice>No relational items</v-notice>
	</template>

	<template v-else>
		<div class="collection-filter">
			<v-chip :label="false" clickable :class="filterCollection === 'all' ? 'active' : ''" @click.stop="filterCollection = 'all'">
				All <span class="item-count">{{ totalItemCount >= 1_000 ? abbreviateNumber(totalItemCount, 1) : totalItemCount }}</span>
			</v-chip>
			<template v-for="item in collections" :key="item.collection">
				<v-chip v-if="item.item_count > 0" :label="false" clickable :class="filterCollection === item.collection ? 'active' : ''" @click.stop="filterCollection = item.collection, page = 1">
					{{ collectionName(item.collection, 'plural') }} <span class="item-count">{{ item.item_count >= 1_000 ? abbreviateNumber(item.item_count, 1) : item.item_count }}</span>
				</v-chip>
			</template>
		</div>
		<v-list v-if="relatedView">
			<v-list-item
				v-for="item, index in relatedView"
				:key="index"
				:class="{
					disabled: item.disabled,
					has_datetime: 'timestamp' in item.data || 'date_created' in item.data,
				}"
				block
				:dense="(filterCollection === 'all' && totalItemCount > 4) || relatedItems.filter(i => (i.collection === filterCollection)).length > 4"
				clickable
				@click="startEditing(item)"
			>
				<div class="record-name-container">
					<div v-if="'date_created' in item.data" class="date-created" x-small>
						<render-template
							:collection="item.collection"
							:fields="item.fields"
							template="{{ date_created }}"
							:item="item.data"
						/>
					</div>
					<div v-if="'timestamp' in item.data" class="date-created" x-small>
						<render-template
							:collection="item.collection"
							:fields="item.fields"
							template="{{ timestamp }}"
							:item="item.data"
						/>
					</div>

					<div class="record-name">
						<span v-if="filterCollection === 'all'" class="collection">{{ collectionName(item.collection) }}:&nbsp;</span>

						<render-template
							:collection="item.collection"
							:fields="item.fields"
							:template="item.template"
							:item="item.data"
						/>
					</div>
				</div>

				<div class="chips">
					<v-chip v-if="item.collection === 'directus_files' && item.data.type" class="file-type" x-small>
						{{ item.data.type }}
					</v-chip>
					<v-chip v-if="item.collection === 'directus_panels' && item.data.dashboard?.name" class="dashboard-name" x-small>
						{{ formatTitle(item.data.dashboard.name) }}
					</v-chip>
					<v-chip v-if="item.field" class="field" x-small>
						{{ formatTitle(item.field) }}
					</v-chip>
					<v-chip v-if="item.type" class="relation" x-small>
						{{ item.type.toUpperCase() }}
					</v-chip>

					<div v-if="!item.disabled && item.item_id" class="item-actions">
						<router-link
							v-tooltip="t('navigate_to_item')"
							:to="getItemRoute(item.collection, item.item_id)"
							class="item-link"
							@click.stop
						>
							<v-icon name="launch" />
						</router-link>
					</div>
				</div>
			</v-list-item>
		</v-list>
		<v-pagination
			v-if="(filterCollection === 'all' && totalItemCount > 10) || (filterCollection !== 'all' && (collections[filterCollection]?.item_count ?? 10) > 10)"
			v-model="page"
			:length="Math.ceil(((filterCollection === 'all' ? totalItemCount : collections[filterCollection]?.item_count) ?? 10) / limit)"
			:total-visible="4"
			show-first-last
		/>
	</template>

	<drawer-item
		:active="!!editModalActive"
		:disabled="editDisabled"
		:collection="editingCollection"
		:primary-key="currentlyEditing ?? '+'"
		:edits="editsAtStart"
		@input="saveEdits"
		@update:active="cancelEdit"
	/>
</template>

<style lang="css" scoped>
.field-label {
	margin-bottom: 0.5em;
}

.disabled {
	color: var(--theme--foreground-subdued);
}

.v-list-item.has_datetime {
	height: auto;
}

.record-name-container {
	flex: 1;
	min-width: 0;
}

.chips {
	flex-shrink: 0;
	display: flex;
	align-items: center;
}

.record-name {
	display: flex;
	align-items: self-end;
}

.date-created {
	font-size: small;
	line-height: 1;
	margin-top: 0.2em;
}

.collection {
	color: var(--theme--primary);
	font-weight: bold;
	white-space: nowrap;
	line-height: 21px;
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

.collection-filter .v-chip.active, .collection-filter .v-chip:hover {
	background-color: var(--theme--primary);
	border-color: var(--theme--primary);
	color: var(--white);
}

.collection-filter .v-chip:hover .item-count, .collection-filter .v-chip.active .item-count {
	background-color: var(--theme--primary-accent);
	color: var(--white);
}

.v-chip.file-type, .v-chip.dashboard-name, .v-chip.date-created, .v-chip.field {
	margin-right: 0.5em;
}

.item-link {
	--v-icon-color: var(--theme--foreground-subdued);
	margin-left: 0.5em;
}
.item-link:hover {
	--v-icon-color: var(--theme--form--field--input--foreground);
}

.v-pagination {
	margin-top: 0.75em;
}
</style>
