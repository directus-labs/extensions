import { defineLayout } from '@directus/extensions-sdk';
import LayoutComponent from './layout.vue';

import { computed, toRefs, ref, unref, Ref } from 'vue';
import { useItems, useCollection, useSync } from '@directus/extensions-sdk';
import Options from './options.vue'

function syncRefProperty<R, T extends keyof R>(ref: Ref<R>, key: T, defaultValue: R[T] | Ref<R[T]>) {
	return computed<R[T]>({
		get() {
			return ref.value?.[key] ?? unref(defaultValue);
		},
		set(value: R[T]) {
			ref.value = Object.assign({}, ref.value, { [key]: value }) as R;
		},
	});
}

export default defineLayout({
	id: 'gantt-chart',
	name: 'Gantt Chart',
	icon: 'box',
	component: LayoutComponent,
	slots: {
		options: Options,
		sidebar: () => null,
		actions: () => null,
	},
	setup(props, { emit }) {

		const layoutOptions = useSync(props, 'layoutOptions', emit);

		const labelField = syncRefProperty(layoutOptions, 'labelField', undefined);
		const startDateField = syncRefProperty(layoutOptions, 'startDateField', undefined);
		const endDateField = syncRefProperty(layoutOptions, 'endDateField', undefined);
		const dependenciesField = syncRefProperty(layoutOptions, 'dependenciesField', undefined);
		const viewMode = syncRefProperty(layoutOptions, 'viewMode', undefined);

		const { collection, filter, search, selection, selectMode, readonly } = toRefs(props);
		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection as any);

		const page = ref(1);
		const { 
			items,
			loading,
			error,
			totalPages,
			itemCount,
			totalCount,
			changeManualSort,
			getItems,
			getItemCount,
			getTotalCount
		} = useItems(collection, {
			sort: primaryKeyField.field,
			limit: '-1',
			page: page,
			fields: '*',
			filter,
			search,
		});

		function refresh() {
			getItems();
			getTotalCount();
			getItemCount();
		}

		return {
			collection,
			layoutOptions,
			info,
			page,
			primaryKeyField,
			items,
			loading,
			filter,
			search,
			fieldsInCollection,
			selection, 
			selectMode, 
			readonly,
			changeManualSort,
			refresh,
			labelField,
			startDateField,
			endDateField,
			dependenciesField,
			viewMode,
			error, totalPages, itemCount, totalCount, getItems, getTotalCount, getItemCount
		};
	},
});
