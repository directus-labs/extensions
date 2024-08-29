<template>
	<div class="panel-table" :class="{ 'has-header': showHeader }">
		<v-info type="warning" icon="warning" :center="true" v-if="!tableData && !isLoading" title="No Items"></v-info>
		<v-info type="warning" icon="warning" :center="true" v-else-if="fields.length == 0" title="No Fields Selected"></v-info>
		<v-info type="danger" icon="error" :center="true" v-else-if="hasError" :title="errorResponse.title">{{ errorResponse.message }}</v-info>
		<v-table
			v-else
				:sort="tableSort"
				:headers="tableHeaders"
				:items="tableData"
				:item-key="primaryKeyField?.field"
				:class="{ 'no-last-border': tableData.length <= limit }"
				:loading="isLoading"
				:selectionUseKeys="true"
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
				<v-info type="danger" icon="error" :title="errorResponse.title">{{ errorResponse.message }}</v-info>
				<v-button @click="responseDialog = false">Dismiss</v-button>
			</v-sheet>
		</v-dialog>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import { defineComponent, onMounted, ref, watch } from 'vue';
import { get, set } from 'lodash';

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
	setup(props){
		const { t } = useI18n();
		const api = useApi();
		const { useFieldsStore, useRelationsStore, usePermissionsStore, useNotificationsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const notificationStore = useNotificationsStore();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const canUpdate = hasPermission(props.collection, 'update');
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(props.collection);
		const sortField = ref(props.sort_field || primaryKeyField.field);
		const sortDirection = ref(props.sort_direction || 'desc');

		const tableData = ref<Array<Record<string, any>>>([]);
		const tableHeaders = ref<Array<any>>([]);
		const tableIDs = ref<Array<string>>([]);
		const tableSort = ref<Record<string, any>>({});
		const tableCellWidth = ref<Record<string, number>>({});
		const minCellWidth = 10;
		const hasError = ref<boolean>(false);
		const errorResponse = ref<Record<string, String>>({
			title: '',
			message: '',
		});
		const responseDialog = ref<Boolean>(false);
		const isLoading = ref<boolean>(true);
		const viewItem = ref<string | null>(null);
		const itemEdits = ref<Record<string, any>>({});

		async function fetchData(options: Record<string, any>): Promise<void> {
			if(!options.sort_field || !options.sort_direction || !props.collection) return;
			hasError.value = false;
			isLoading.value = true;
			const fields: string[] = [primaryKeyField.field, ...props.fields];
			try{
				const response = await api.get(`/items/${props.collection}`,{
					params: {
						limit: props.limit ? props.limit : 10,
						filter: props.filter,
						fields: fields,
						sort: await sortKey(options.sort_field, options.sort_direction),
					}
				});
				
				tableIDs.value = [];
				tableData.value = response.data.data.map((item: Record<string, any>) => {
					let id = item[primaryKeyField.field];

					if(tableIDs.value.includes(String(id))) return null;

					props.fields.forEach((field_key) => {
						let content_length = minCellWidth;
						if(field_key.includes('.')){
							let keys = field_key.split('.');
							if(keys.length > 2){
								let content: Record<string, any> = item;
								for (let idx = 0; idx < keys.length; idx++) {
									const key = keys[idx];
									if(key != undefined && content[key] !== undefined && content[key] !== null){
										content =  content[key];
									}
								}

								if(Array.isArray(content)){
									set(item, field_key, `${content.length} item${content.length > 1?'s':''}`);
								}
							}
						}

						let rel_item = get(item, field_key);
						content_length = rel_item == null || String(rel_item).length < minCellWidth ? minCellWidth : String(rel_item).length;

						if(tableCellWidth.value[field_key] == undefined || content_length > tableCellWidth.value[field_key]){
							tableCellWidth.value[field_key] = content_length;
						}

						tableIDs.value.push(String(id));
					});
					return item;
				}).filter((field: Object | null) => field !== null);

				if(!options.refresh){
					await fetchHeaders();
				} else {
					props.fields.forEach((item, idx) => {
						tableHeaders.value[idx].width = tableCellWidth.value[item] !== undefined && tableCellWidth.value[item] < 24 ? tableCellWidth.value[item] * 10 + (tableHeaders.value[idx].type == 'date' ? 30 : 20 ) : 390;
					});
				}
				isLoading.value = false;
			} catch(error) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				hasError.value = true;
			};
		}

		function relationalCheck(fields: string){
			if(!fields.includes(".")) return { collection: props.collection, fieldPath: fields };
			const relationsStore = useRelationsStore();
			const [field, ...path] = fields.split('.') as [string] & string[];
			const relations = relationsStore.getRelationsForField(props.collection, field);

			const relation = relations?.find((relation: Record<string, any>) => {
				return relation.field === field || relation.meta?.one_field === field;
			});

			const relatedCollection = (relation === undefined ? props.collection : (relation.field === field && relation.related_collection !== props.collection ? relation.related_collection : relation.collection));

			return { collection: relatedCollection, fieldPath: path.join('.') };
		}

		async function fetchHeaders(): Promise<void> {
			tableHeaders.value = props.fields.map((field_key: string) => {
				if(!props.collection) return null;
				const { collection, fieldPath } = relationalCheck(field_key);
				const field = fieldsStore.getField(collection, fieldPath);
				if(!field) return null;
				if(field.type == 'timestamp' && field.meta.display_options.relative) tableCellWidth.value[field_key] = 14;

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
					width: tableCellWidth.value[field_key] !== undefined && tableCellWidth.value[field_key] < 24 ? tableCellWidth.value[field_key] * 10 + (field.type == 'date' ? 30 : 20 ) : 390, // previously 160
					sortable: !['json'].includes(field.type),
				};
			}).filter((field: Object | string | null) => field !== null);
		}

		async function sortKey(sort_field: string, sort_direction: string): Promise<Array<string>> {
			if(!sort_field) return [primaryKeyField.field];
			tableSort.value = {
				by: sort_field,
				desc: sort_direction == 'desc'
			};
			return [`${sort_direction != 'asc'?'-':''}${sort_field}`];
		}

		async function editRow(e: any) {
			viewItem.value = e.item[primaryKeyField.field];
		}

		async function cancelEdit(){
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
			} catch (error) {
				errorResponse.value.title = error.code || 'UNKNOWN';
				errorResponse.value.message = error.message || t('errors.UNKNOWN');
				responseDialog.value = true;
			}
		}

		async function sortTrigger(sort: any): Promise<void> {
			if(!sort){
				fetchData({
					sort_field: sortField.value,
					sort_direction: sortDirection.value,
					refresh: true,
				});
			} else {
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
				refresh: tableHeaders.value.length > 0
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
					sort_field: props.sort_field || primaryKeyField.field,
					sort_direction: props.sort_direction || 'desc',
					refresh: false
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

.panel-table-dialog.v-sheet {
	text-align: center;
	min-width: 300px;
	width: 400px;
}

.panel-table-dialog .v-info {
	margin-bottom: 1em;
}
</style>
