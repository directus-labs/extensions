<!-- eslint-disable vue/prop-name-casing -->
<script lang="ts">
import { useApi, useStores } from '@directus/extensions-sdk';
import { get, set } from 'lodash';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},
		dashboard: {
			type: String,
		},
		collection: {
			type: String,
		},
		sort_field: {
			type: String,
			default: null,
		},
		sort_direction: {
			type: String,
			default: 'desc',
		},
		filter: {
			type: Object,
			// eslint-disable-next-line vue/require-valid-default-prop
			default: {},
		},
		fields: {
			type: Array<string>,
			default: [],
		},
		limit: {
			type: Number,
			default: 10,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const api = useApi();
		const { useFieldsStore, useRelationsStore, usePermissionsStore, useNotificationsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const notificationStore = useNotificationsStore();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const canUpdate = hasPermission(props.collection, 'update');
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(props.collection);
		const sortField = ref(props.sort_field || primaryKeyField?.field);
		const sortDirection = ref(props.sort_direction || 'desc');

		const tableData = ref<Array<Record<string, any>>>([]);
		const tableHeaders = ref<Array<any>>([]);
		const tableIDs = ref<Array<string>>([]);
		const tableSort = ref<Record<string, any>>({});
		const tableCellWidth = ref<Record<string, number>>({});
		const minCellWidth = 10;
		const hasError = ref<boolean>(false);

		const errorResponse = ref<Record<string, string>>({
			title: '',
			message: '',
		});

		const responseDialog = ref<boolean>(false);
		const isLoading = ref<boolean>(true);
		const viewItem = ref<string | null>(null);
		const itemEdits = ref<Record<string, any>>({});

		async function fetchData(options: Record<string, any>): Promise<void> {
			if (!props.collection)
				return;
			hasError.value = false;
			isLoading.value = true;
			const fields: string[] = [primaryKeyField?.field, ...props.fields].filter((field) => field != null);

			try {
				const response = await api.get(`/items/${props.collection}`, {
					params: {
						limit: props.limit ? props.limit : 10,
						filter: props.filter,
						fields,
						sort: await sortKey(options?.sort_field, options?.sort_direction),
					},
				});

				tableIDs.value = [];

				tableData.value = response.data.data.map((item: Record<string, any>) => {
					const id = item[primaryKeyField.field];

					if (tableIDs.value.includes(String(id)))
						return null;

					props.fields.forEach((field_key) => {
						let content_length = minCellWidth;

						if (field_key.includes('.')) {
							const keys = field_key.split('.');

							if (keys.length > 2) {
								let content: Record<string, any> = item;

								for (let idx = 0; idx < keys.length; idx++) {
									const key = keys[idx];

									if (key !== undefined && content[key] !== undefined && content[key] !== null) {
										content = content[key];
									}
								}

								if (Array.isArray(content)) {
									set(item, field_key, `${content.length} item${content.length > 1 ? 's' : ''}`);
								}
							}
						}

						const rel_item = get(item, field_key);
						content_length = rel_item == null || String(rel_item).length < minCellWidth ? minCellWidth : String(rel_item).length;

						if (tableCellWidth.value[field_key] === undefined || content_length > tableCellWidth.value[field_key]) {
							tableCellWidth.value[field_key] = content_length;
						}

						tableIDs.value.push(String(id));
					});

					return item;
				}).filter((field: object | null) => field !== null);

				if (!options.refresh) {
					await fetchHeaders();
				}

				isLoading.value = false;
			}
			catch (error) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				hasError.value = true;
				isLoading.value = false;
			}

			;
		}

		function relationalCheck(fields: string) {
			if (!fields.includes('.'))
				return { collection: props.collection, fieldPath: fields };
			const relationsStore = useRelationsStore();
			const [field, ...path] = fields.split('.') as [string] & string[];
			const relations = relationsStore.getRelationsForField(props.collection, field);

			const relation = relations?.find((relation: Record<string, any>) => {
				return relation.field === field || relation.meta?.one_field === field;
			});

			// eslint-disable-next-line no-nested-ternary
			const relatedCollection = (relation === undefined ? props.collection : (relation.field === field && relation.related_collection !== props.collection ? relation.related_collection : relation.collection));

			return { collection: relatedCollection, fieldPath: path.join('.') };
		}

		async function fetchHeaders(): Promise<void> {
			tableHeaders.value = props.fields.map((field_key: string) => {
				if (!props.collection)
					return null;
				const { collection, fieldPath } = relationalCheck(field_key);
				const field = fieldsStore.getField(collection, fieldPath);
				if (!field)
					return null;
				if (field.type === 'timestamp' && field.meta.display_options.relative)
					tableCellWidth.value[field_key] = 14;

				return {
					display: field.meta.display,
					display_options: field.meta.display_options,
					interface: field.meta.interface,
					interface_options: field.meta.interface_options,
					collection: field.collection,
					text: field.name,
					field: field.field,
					type: field.type,
					value: field_key,
					width: tableCellWidth.value[field_key] !== undefined && tableCellWidth.value[field_key] < 24 ? tableCellWidth.value[field_key] * 10 + (field.type === 'date' ? 30 : 20) : 390, // previously 160
					sortable: !['json'].includes(field.type),
				};
			}).filter((field: object | string | null) => field !== null);
		}

		async function sortKey(sort_field: string, sort_direction: string): Promise<Array<string>> {
			if (!sort_field)
				return [];
			return [`${sort_direction !== 'asc' ? '-' : ''}${sort_field}`];
		}

		async function editRow(e: any) {
			viewItem.value = e.item[primaryKeyField.field];
		}

		async function cancelEdit() {
			viewItem.value = null;
			itemEdits.value = {};
		}

		async function saveChanges(item: Record<string, any>): Promise<void> {
			try {
				await api.patch(`/items/${(props.collection)}/${viewItem.value}`, item);

				notificationStore.add({
					title: t('item_update_success', 1),
				});

				fetchData({
					sort_field: sortField.value,
					sort_direction: sortDirection.value,
					refresh: false,
				});
			}
			catch (error) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				responseDialog.value = true;
			}
		}

		async function sortTrigger(sort: any): Promise<void> {
			if (!sort) {
				tableSort.value = {};

				fetchData({
					sort_field: sortField.value,
					sort_direction: sortDirection.value,
					refresh: true,
				});
			}
			else {
				tableSort.value = sort;

				fetchData({
					sort_field: sort.by,
					sort_direction: (sort.desc ? 'desc' : 'asc'),
					refresh: true,
				});
			}
		}

		onMounted(() => {
			fetchData({
				sort_field: sortField.value,
				sort_direction: sortDirection.value,
				refresh: tableHeaders.value.length > 0,
			});
		});

		// Changes to panel
		watch(
			[
				() => props.collection,
				() => props.sort_field,
				() => props.sort_direction,
				() => props.filter,
				() => props.fields,
				() => props.limit,
			],
			() => {
				fetchData({
					sort_field: props.sort_field || primaryKeyField?.field,
					sort_direction: props.sort_direction || 'desc',
					refresh: false,
				});
			},
		);

		return {
			// System
			t,
			get,
			isLoading,

			// Errors
			hasError,
			errorResponse,
			responseDialog,

			// Permissions
			canRead,
			canUpdate,

			// Table
			primaryKeyField,
			tableHeaders,
			tableData,
			tableSort,

			// Sorting
			sortTrigger,
			sortKey,

			// Editing Drawer
			viewItem,
			saveChanges,
			editRow,
			cancelEdit,
			itemEdits,
		};
	},
});
</script>

<template>
	<div class="panel-table" :class="{ 'has-header': showHeader }">
		<v-info v-if="!collection" type="danger" icon="error" center title="No Collection Selected" />
		<v-info v-else-if="fields.length === 0" type="warning" icon="warning" center title="No Fields Selected" />
		<v-info v-else-if="!canRead" type="danger" icon="error" center title="Forbidden">
			You do not have permissions to see this table
		</v-info>
		<v-info v-else-if="hasError" type="danger" icon="error" :title="errorResponse?.title">
			{{ errorResponse?.message }}
		</v-info>
		<template v-else>
			<v-table
				:sort="tableSort"
				:headers="tableHeaders"
				:items="tableData"
				:item-key="primaryKeyField?.field"
				:class="{ 'no-last-border': tableData.length <= limit }"
				:loading="isLoading"
				selection-use-keys
				:show-resize="false"
				@click:row="editRow"
				@update:sort="sortTrigger"
			>
				<template v-for="header in tableHeaders" :key="header.value" #[`item.${header.value}`]="{ item }">
					<render-display
						:value="get(item, header.value)"
						:display="header.display"
						:options="header.display_options"
						:interface="header.interface"
						:interface-options="header.interface_options"
						:type="header.type"
						:collection="header.collection"
						:field="header.value"
					/>
				</template>
			</v-table>
			<div v-if="tableData.length === 0 && !isLoading" class="no-item-message">
				No Items
			</div>

			<drawer-item
				:disabled="!canUpdate"
				:active="viewItem !== null"
				:collection="collection"
				:primary-key="viewItem || '+'"
				@input="saveChanges"
				@update:active="cancelEdit"
			/>
			<v-dialog v-model="responseDialog" @esc="responseDialog = false">
				<v-sheet class="panel-table-dialog">
					<v-info type="danger" icon="error" :title="errorResponse?.title">
						{{ errorResponse?.message }}
					</v-info>
					<v-button @click="responseDialog = false">
						Dismiss
					</v-button>
				</v-sheet>
			</v-dialog>
		</template>
	</div>
</template>

<style scoped>
.panel-table {
	padding: 0;
	border-radius: var(--border-radius);
	overflow: hidden;
	position: relative;
	height: 100%;
}

.panel-table.has-header {
	padding: 0;
}
</style>

<style>
.panel-table .v-table {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow: scroll;
}

.panel-table table thead tr {
	position: sticky;
	top: 0;
}

.panel-table tr.no-items-text {
	display: none;
}

.panel-table .no-item-message {
	position: absolute;
	top: 3.5em;
	right: 0;
	left: 0;
	text-align: center;
	padding: 2em;
	color: var(--theme--foreground-subdued);
}

.panel-table-dialog.v-sheet {
	text-align: center;
	min-width: 300px;
	width: 400px;
}

.panel-table-dialog .v-info {
	margin-bottom: 1em;
}
</style>
