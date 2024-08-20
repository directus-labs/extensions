<template>
	<div class="panel-table" :class="{ 'has-header': showHeader }">
		<v-info type="warning" icon="warning" :center="true" v-if="!tableData && !isLoading" title="No Items"></v-info>
		<v-info type="danger" icon="error" :center="true" v-else-if="hasError" :title="t('errors.INTERNAL_SERVER_ERROR')">{{ errorMessage }}</v-info>
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
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { useApi, useStores } from '@directus/extensions-sdk';
import { defineComponent, ref, watch } from 'vue';
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
			default: '',
		},
		sort_field: {
			type: String,
			default: '',
		},
		sort_direction: {
			type: String,
			default: 'sort_desc',
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
		const { useFieldsStore, usePermissionsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const { hasPermission } = usePermissionsStore();
		const canRead = hasPermission(props.collection, 'read');
		const canUpdate = hasPermission(props.collection, 'update');
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(props.collection);

		const tableData = ref<Array<Record<string, any>>>([]);
		const tableHeaders = ref<Array<any>>([]);
		const tableIDs = ref<Array<string>>([]);
		const tableSort = ref<Record<string, any>>({});
		const tableCellWidth = ref<Record<string, number>>({});
		const minCellWidth = 10;
		const hasError = ref<boolean>(false);
		const errorMessage = ref<String>('');
		const isLoading = ref<boolean>(true);
		const viewItem = ref<string | null>(null);
		const itemEdits = ref<Record<string, any>>({});

		function fetchData(options: Record<string, any>): void {
			if(!options.sort_field || !options.sort_direction || !props.collection) return;
			hasError.value = false;
			isLoading.value = true;
			const fields: string[] = [primaryKeyField.field, ...props.fields];
			api.get(`/items/${props.collection}`,{
				params: {
					filter: props.filter,
					fields: fields,
					limit: props.limit ? props.limit : 10,
					sort: sortKey(options.sort_field, options.sort_direction),
				}
			}).then((res) => {
				tableIDs.value = [];
				tableData.value = res.data.data.map((item: Record<string, any>) => {
					let id = item[primaryKeyField.field];

					if(tableIDs.value.includes(String(id))) return null;

					props.fields.forEach((field_key) => {
						console.log(`${field_key}:`);
						console.log(item[field_key]);
						let content_length = minCellWidth;
						if(field_key.includes('.')){
							let keys = field_key.split('.');
							console.log(keys);
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
					fetchHeaders();
				}
				isLoading.value = false;
			}).catch((error) => {
				errorMessage.value = error.response.data.errors[0].message;
				hasError.value = true;
			});
		}

		function fetchHeaders(){
			tableHeaders.value = props.fields.map((field_key: string) => {
				const field = fieldsStore.getField(props.collection, field_key);
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

		function sortKey(sort_field: string, sort_direction: string) {
			if(!sort_field) return;
			tableSort.value = {
				by: sort_field,
				desc: sort_direction == 'sort_desc'
			};
			return [`${sort_direction != 'sort_asc'?'-':''}${sort_field}`];
		}

		function editRow(e: any) {
			viewItem.value = e.item[primaryKeyField.field];
		}

		function cancelEdit(e: any){
			viewItem.value = null;
			itemEdits.value = {};
		}

		async function saveChanges(item: Record<string, any>) {
			try {
				await api.patch(`/items/${(props.collection)}/${viewItem.value}`, item);
			} catch (error) {
				console.log(error);
			}
			fetchData({
				sort_field: props.sort_field,
				sort_direction: props.sort_direction,
				refresh: true
			});
		}

		function sortTrigger(sort: any){
			if(!sort){
				fetchData({
					sort_field: props.sort_field,
					sort_direction: props.sort_direction,
					refresh: true,
				});
			} else {
				fetchData({
					sort_field: sort.by,
					sort_direction: (sort.desc ? 'sort_desc' : 'sort_asc'),
					refresh: true,
				});
			}
		}

		// On load
		fetchData({
			sort_field: props.sort_field,
			sort_direction: props.sort_direction,
			refresh: tableHeaders.value.length > 0
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
					sort_field: props.sort_field,
					sort_direction: props.sort_direction,
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
			errorMessage,

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

.panel-table table {

}

.panel-table table thead tr {
	position: sticky;
	top: 0;
}

.panel-table table tbody {

}
</style>
