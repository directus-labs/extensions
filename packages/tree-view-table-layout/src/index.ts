import type { Field, Filter, Item, PrimaryKey } from '@directus/types';
import type { HeaderRaw, Sort } from './core-clones/components/v-table/types';
import type { LayoutOptions, LayoutQuery } from './types';
import {
	defineLayout,
	useApi,
	useCollection,
	useExtensions,
	useItems,
	useStores,
	useSync,
} from '@directus/extensions-sdk';
import { getEndpoint } from '@directus/utils';
import { debounce, flatten } from 'lodash';
import {
	computed,
	type ComputedRef,
	provide,
	ref,
	type Ref,
	toRefs,
	unref,
	watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import Actions from './actions.vue';
// CORE IMPORTS
import { useAliasFields } from './core-clones/composables/use-alias-fields';
import { useLayoutClickHandler } from './core-clones/composables/use-layout-click-handler';
import { adjustFieldsForDisplays } from './core-clones/utils/adjust-fields-for-displays';
import { formatItemsCountPaginated } from './core-clones/utils/format-items-count';
import { getDefaultDisplayForType } from './core-clones/utils/get-default-display-for-type';
import { hideDragImage } from './core-clones/utils/hide-drag-image';
import { saveAsCSV } from './core-clones/utils/save-as-csv';
import { syncRefProperty } from './core-clones/utils/sync-ref-property';
import Layout from './layout.vue';
import Options from './options.vue';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'directus-labs-tree-view-table-layout',
	name: 'Tree View Table',
	icon: 'format_indent_increase',
	component: Layout,
	slots: {
		options: Options,
		sidebar: () => undefined,
		actions: Actions,
	},
	headerShadow: false,
	setup(props, { emit }) {
		const system = { stores: useStores(), extensions: useExtensions() };
		provide('system', system);

		const { useFieldsStore } = system.stores;
		const fieldsStore = useFieldsStore();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);

		const { collection, filter, filterSystem, filterUser, search }
            = toRefs(props);

		const {
			info,
			primaryKeyField,
			fields: fieldsInCollection,
			sortField,
		} = useCollection(collection);

		const { sort, limit, page, fields } = useItemOptions();

		const { aliasedFields, aliasQuery, aliasedKeys } = useAliasFields(
			fields,
			collection,
			system,
		);

		const fieldsWithRelationalAliased = computed(() =>
			flatten(
				Object.values(aliasedFields.value).map(({ fields }) => fields),
			),
		);

		const { parentField, fieldsToQuery } = useTreeViewFieldsToQuery({
			fieldsWithRelationalAliased,
			primaryKeyField,
			sortField,
		});

		const { onClick } = useLayoutClickHandler({
			props,
			selection,
			primaryKeyField,
		});

		const {
			items,
			loading,
			error,
			totalPages,
			itemCount,
			totalCount,
			getItems,
			getItemCount,
			getTotalCount,
		} = useItems(collection, {
			sort,
			limit,
			page,
			fields: fieldsToQuery,
			alias: aliasQuery,
			filter,
			search,
			filterSystem,
		});

		const {
			tableSort,
			tableHeaders,
			tableRowHeight,
			onSortChange,
			onAlignChange,
			activeFields,
			tableSpacing,
		} = useTable();

		const showingCount = computed(() => {
			// Don't show count if there are no items
			if (!totalCount.value || !itemCount.value)
				return;

			return formatItemsCountPaginated({
				currentItems: itemCount.value,
				currentPage: page.value,
				perPage: 25, // limit.value,
				isFiltered: !!filterUser.value,
				totalItems: totalCount.value,
			});
		});

		const { isFiltered } = useFilteringTreeView({ filterUser, search });

		const { saveEdits } = useSaveEdits();

		return {
			tableHeaders,
			items,
			loading,
			error,
			totalPages,
			tableSort,
			onRowClick: onClick,
			onSortChange,
			onAlignChange,
			tableRowHeight,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			fields,
			limit,
			activeFields,
			tableSpacing,
			parentField,
			primaryKeyField,
			info,
			showingCount,
			sortField,
			hideDragImage,
			refresh,
			resetPresetAndRefresh,
			selectAll,
			filter,
			search,
			download,
			fieldsWithRelationalAliased,
			aliasedFields,
			aliasedKeys,
			saveEdits,
			isFiltered,
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
			getTotalCount();
			getItemCount();
		}

		function download() {
			if (!collection.value)
				return;
			saveAsCSV(collection.value, fields.value, items.value, system);
		}

		function toPage(newPage: number) {
			page.value = newPage;
		}

		function selectAll() {
			if (!primaryKeyField.value)
				return;
			const pk = primaryKeyField.value;
			selection.value = items.value.map((item) => item[pk.field]);
		}

		function useItemOptions() {
			const page = syncRefProperty(layoutQuery, 'page', 1);
			const limit = syncRefProperty(layoutQuery, 'limit', -1);

			const defaultSort = computed(() => {
				const field = sortField.value ?? primaryKeyField.value?.field;
				return field ? [field] : [];
			});

			const sort = syncRefProperty(layoutQuery, 'sort', defaultSort);

			const fieldsDefaultValue = computed(() => {
				return fieldsInCollection.value
					.filter(
						(field) =>
							!field.meta?.hidden
							&& !field.meta?.special?.includes('no-data'),
					)
					.slice(0, 4)
					.map(({ field }) => field)
					.sort();
			});

			const fields = computed({
				get() {
					if (layoutQuery.value?.fields) {
						return layoutQuery.value.fields.filter((field) =>
							fieldsStore.getField(collection.value!, field),
						);
					}
					else {
						return unref(fieldsDefaultValue);
					}
				},
				set(value) {
					layoutQuery.value = Object.assign({}, layoutQuery.value, {
						fields: value,
					});
				},
			});

			const fieldsWithRelational = computed(() => {
				if (!props.collection)
					return [];
				return adjustFieldsForDisplays(
					fields.value,
					props.collection,
					system,
				);
			});

			return { sort, limit, page, fields, fieldsWithRelational };
		}

		function useTable() {
			const tableSort = computed(() => {
				if (!sort.value?.[0]) {
					return null;
				}
				else if (sort.value?.[0].startsWith('-')) {
					return { by: sort.value[0].substring(1), desc: true };
				}
				else {
					return { by: sort.value[0], desc: false };
				}
			});

			const localWidths = ref<{ [field: string]: number }>({});

			watch(
				() => layoutOptions.value,
				() => {
					localWidths.value = {};
				},
			);

			const saveWidthsToLayoutOptions = debounce(() => {
				layoutOptions.value = Object.assign({}, layoutOptions.value, {
					widths: localWidths.value,
				});
			}, 350);

			const activeFields = computed<(Field & { key: string })[]>({
				get() {
					if (!collection.value)
						return [];

					return fields.value
						.map((key) => ({
							...fieldsStore.getField(collection.value!, key),
							key,
						}))
						.filter(
							(f) =>
								f
								&& f.meta?.special?.includes('no-data') !== true,
						) as (Field & { key: string })[];
				},
				set(val) {
					fields.value = val.map((field) => field.field);
				},
			});

			const tableHeaders = computed<HeaderRaw[]>({
				get() {
					return activeFields.value.map((field) => {
						let description: string | null = null;

						const fieldParts = field.key.split('.');

						if (fieldParts.length > 1) {
							const fieldNames = fieldParts.map(
								(fieldKey, index) => {
									const pathPrefix = fieldParts.slice(
										0,
										index,
									);

									const field = fieldsStore.getField(
										collection.value!,
										[...pathPrefix, fieldKey].join('.'),
									);

									return field?.name ?? fieldKey;
								},
							);

							description = fieldNames.join(' -> ');
						}

						return {
							text: field.name,
							value: field.key,
							description,
							width:
                                localWidths.value[field.key]
                                || layoutOptions.value?.widths?.[field.key]
                                || null,
							align:
                                layoutOptions.value?.align?.[field.key]
                                || 'left',
							field: {
								display:
                                    field.meta?.display
                                    || getDefaultDisplayForType(field.type),
								displayOptions: field.meta?.display_options,
								interface: field.meta?.interface,
								interfaceOptions: field.meta?.options,
								type: field.type,
								field: field.field,
								collection: field.collection,
							},
							sortable:
                                ['json', 'alias', 'presentation', 'translations'].includes(field.type) === false,
						} as HeaderRaw;
					});
				},
				set(val) {
					const widths = {} as { [field: string]: number };

					val.forEach((header) => {
						if (header.width) {
							widths[header.value] = header.width;
						}
					});

					localWidths.value = widths;

					saveWidthsToLayoutOptions();

					fields.value = val.map((header) => header.value);
				},
			});

			const tableSpacing = syncRefProperty(
				layoutOptions,
				'spacing',
				'cozy',
			);

			const tableRowHeight = computed<number>(() => {
				switch (tableSpacing.value) {
					case 'compact':
						return 32;
					case 'comfortable':
						return 64;
					case 'cozy':
					default:
						return 48;
				}
			});

			return {
				tableSort,
				tableHeaders,
				tableSpacing,
				tableRowHeight,
				onSortChange,
				onAlignChange,
				activeFields,
				getFieldDisplay,
			};

			function onSortChange(newSort: Sort | null) {
				if (!newSort?.by) {
					sort.value = [];
					return;
				}

				let sortString = newSort.by;

				if (newSort.desc === true) {
					sortString = `-${sortString}`;
				}

				sort.value = [sortString];
			}

			function onAlignChange(
				field: string,
				align: 'left' | 'center' | 'right',
			) {
				layoutOptions.value = Object.assign({}, layoutOptions.value, {
					align: {
						...(layoutOptions.value?.align ?? {}),
						[field]: align,
					},
				});
			}

			function getFieldDisplay(fieldKey: string) {
				const field = fieldsInCollection.value.find(
					(field: Field) => field.field === fieldKey,
				);

				if (!field?.meta?.display)
					return null;

				return {
					display: field.meta.display,
					options: field.meta.display_options,
				};
			}
		}

		function useTreeViewFieldsToQuery({
			fieldsWithRelationalAliased,
			primaryKeyField,
			sortField,
		}: {
			fieldsWithRelationalAliased: ComputedRef<string[]>;
			primaryKeyField: ComputedRef<Field | null>;
			sortField: ComputedRef<string | null>;
		}) {
			const parentField = syncRefProperty(layoutOptions, 'parent', null);

			const fieldsToQuery = computed(() => {
				const fieldsToQuery = fieldsWithRelationalAliased.value;
				addSortField();
				addParentField();

				return fieldsToQuery;

				function addSortField() {
					if (
						sortField.value
						&& !fieldsToQuery.find(
							(field) => field === sortField.value,
						)
					) {
						fieldsToQuery.push(sortField.value);
					}
				}

				function addParentField() {
					if (
						parentField.value
						&& primaryKeyField.value
						&& !fieldsToQuery.find(
							(field) =>
								field === parentField.value
								|| field
								=== `${parentField.value}.${primaryKeyField.value?.field}`,
						)
					) {
						fieldsToQuery.push(
							`${parentField.value}.${primaryKeyField.value.field}`,
						);
					}
				}
			});

			watch(() => parentField.value, updateItemsOnNewParentQuery);

			return {
				parentField,
				fieldsToQuery,
			};

			function updateItemsOnNewParentQuery(
				newParentField: string | null | undefined,
			) {
				if (newParentField)
					refresh();
			}
		}

		function useFilteringTreeView({
			filterUser,
			search,
		}: {
			filterUser: Ref<Filter | null>;
			search: Ref<string | null | undefined>;
		}) {
			const isFiltered = computed(
				() => !!filterUser.value || !!search.value,
			);

			watch(() => isFiltered.value, turnOffManualSortOnFilter);

			return {
				isFiltered,
			};

			function turnOffManualSortOnFilter(filterIsActive: boolean) {
				if (filterIsActive)
					onSortChange(null);
			}
		}

		function useSaveEdits() {
			const api = useApi();
			const { unexpectedError } = useUnexpectedError();

			return { saveEdits };

			async function saveEdits(edits: Record<PrimaryKey, Item>) {
				try {
					for (const [id, payload] of Object.entries(edits)) {
						await api.patch(
							`${getEndpoint(collection.value!)}/${id}`,
							payload,
						);
					}
				}
				catch (error: any) {
					unexpectedError(error);
				}

				refresh();
			}

			// Based from the core: /app/src/utils/unexpected-error.ts
			function useUnexpectedError() {
				const { useNotificationsStore } = system.stores;
				const notificationStore = useNotificationsStore();
				const { t } = useI18n();

				return {
					unexpectedError(error: any) {
						const code
                            = error.response?.data?.errors?.[0]?.extensions?.code || error?.extensions?.code || 'UNKNOWN';

						notificationStore.add({
							title: t(`errors.${code}`),
							type: 'error',
							code,
							dialog: true,
							error,
						});
					},
				};
			}
		}
	},
});
