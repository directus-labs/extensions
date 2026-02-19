<script setup lang="ts">
import type { DeepPartial, Field } from '@directus/types';
import formatTitle from '@directus/format-title';
import { sortBy } from 'lodash';
import {
	AccordionContent,
	AccordionItem,
	AccordionRoot,
	AccordionTrigger,
} from 'reka-ui';
import { computed, inject, nextTick, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';

const props = withDefaults(
	defineProps<{
		value: Record<string, unknown>[] | null;
		field?: string;
		fields?: DeepPartial<Field>[];
		template?: string;
		addLabel?: string;
		sort?: string;
		limit?: number;
		disabled?: boolean;
		headerPlaceholder?: string;
		collection?: string;
		placeholder?: string;
		direction?: string;
		primaryKey?: string;
		showConfirmDiscard?: boolean;
	}>(),
	{
		fields: () => [],
		addLabel: () => 'add_new',
		headerPlaceholder: () => 'empty_item',
		placeholder: () => 'no_items',
	},
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, unknown>[] | null): void;
}>();

const { t } = useI18n();

const { value } = toRefs(props);

const templateWithDefaults = computed(() =>
	props.fields?.[0]?.field
		? props.template || `{{${props.fields[0].field}}}`
		: '',
);

const fieldsWithNames = computed(
	() =>
		props.fields
			?.map((field) => {
				if (!field || !field.field) {
					console.warn('Invalid field definition:', field);
					return null;
				}

				const { field: fieldName, type, name, ...rest } = field;

				return {
					field: fieldName,
					name: formatTitle(name || fieldName),
					type,
					...rest,
				};
			})
			.filter(Boolean), // Remove any null entries
);

const showAddNew = computed(() => {
	if (props.disabled || fieldsWithNames.value.length === 0)
		return false;
	if (props.value === null)
		return true;
	if (props.limit === undefined)
		return true;
	if (Array.isArray(props.value) && props.value.length < props.limit)
		return true;
	return false;
});

const defaults = computed(() => {
	const values: Record<string, any> = {};

	for (const field of props.fields) {
		if (
			field.schema?.default_value !== undefined
			&& field.schema?.default_value !== null
		) {
			values[field.field!] = field.schema.default_value;
		}
	}

	return values;
});

const internalValue = computed({
	get: () => {
		if (props.fields && props.sort)
			return sortBy(value.value, props.sort);
		return value.value;
	},
	set: (newVal) => {
		value.value =
			props.fields && props.sort ? sortBy(value.value, props.sort) : newVal;
	},
});

const expandedItems = ref<number[]>([]);
const draggedItemIndex = ref<number | null>(null);
const isDragging = ref(false);

function isExpanded(index: number) {
	return expandedItems.value.includes(index);
}

function onDragStart(evt: any) {
	draggedItemIndex.value = evt.oldIndex;
	isDragging.value = true;
}

function onDragEnd(evt: any) {
	if (draggedItemIndex.value !== null && evt.newIndex !== evt.oldIndex) {
		const oldIndex = draggedItemIndex.value;
		const newIndex = evt.newIndex;

		// Update expanded items to reflect the new positions
		const updatedExpandedItems = expandedItems.value.map((expandedIndex) => {
			// If the dragged item was expanded, update its index to the new position
			if (expandedIndex === oldIndex) {
				return newIndex;
			}

			// Adjust other expanded items that were shifted by the drag
			if (oldIndex < newIndex) {
				// Item moved down: shift items between oldIndex and newIndex up
				if (expandedIndex > oldIndex && expandedIndex <= newIndex) {
					return expandedIndex - 1;
				}
			}
			else {
				// Item moved up: shift items between newIndex and oldIndex down
				if (expandedIndex >= newIndex && expandedIndex < oldIndex) {
					return expandedIndex + 1;
				}
			}

			return expandedIndex;
		});

		expandedItems.value = updatedExpandedItems;
	}

	draggedItemIndex.value = null;
	isDragging.value = false;
}

const itemToRemove = ref<number | null>(null);

const { updateNestedValidationErrors } = inject<{
	updateNestedValidationErrors: (field: string, errors: any[]) => void;
}>('nestedValidation', { updateNestedValidationErrors: () => {} });

const itemValidationErrors = computed<Record<number, any[]>>(() => {
	const errorsMap: Record<number, any[]> = {};

	internalValue.value?.forEach((item, index) => {
		const errors: any[] = [];

		for (const field of props.fields ?? []) {
			if (!field.field || !field.meta?.required) continue;

			const val = item[field.field];
			const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);

			if (isEmpty) {
				errors.push({ field: field.field, type: 'nnull' });
			}
		}

		if (errors.length > 0) errorsMap[index] = errors;
	});

	return errorsMap;
});

watch(itemValidationErrors, (errorsMap) => {
	if (!props.field) return;

	const allErrors = Object.entries(errorsMap).flatMap(([indexStr, errors]) => {
		const index = Number(indexStr);
		return errors.map((error) => {
			const fieldDef = props.fields?.find((f) => f.field === error.field);
			return {
				...error,
				// Renders as: "Repeater Field Name → [index] → Sub-field Name"
				field: `${props.field}.${index}.${error.field}`,
				nestedNames: {
					[String(index)]: `[${index + 1}]`,
					[error.field]: fieldDef?.name ?? fieldDef?.field ?? error.field,
				},
			};
		});
	});

	updateNestedValidationErrors(props.field, allErrors);
}, { immediate: true });

const confirmDiscard = ref(false);

function removeItem(index: number) {
	if (props.showConfirmDiscard) {
		itemToRemove.value = index;
		confirmDiscard.value = true;
		return;
	}

	performRemoval(index);
}

function performRemoval(index: number) {
	const newValue = internalValue.value?.filter((_, i) => i !== index);
	emitValue(newValue);
	const expandedIndex = expandedItems.value.indexOf(index);

	if (expandedIndex !== -1) {
		expandedItems.value.splice(expandedIndex, 1);
	}
}

function addNew() {
	const newDefaults: any = {};

	for (const field of props.fields) {
		newDefaults[field.field!] = field.schema?.default_value;
	}

	if (Array.isArray(internalValue.value)) {
		const newIndex = internalValue.value.length;
		emitValue([...internalValue.value, newDefaults]);

		// Expand the new item
		expandedItems.value.push(newIndex);

		// Focus the first input of the last form
		nextTick(() => {
			const forms = document.querySelectorAll('.list-item-form');
			const lastForm = Array.from(forms).at(-1);
			const firstInput = lastForm?.querySelector('input, select, textarea');

			if (firstInput instanceof HTMLElement) {
				firstInput.focus();
			}
		});
	}
	else {
		if (internalValue.value != null) {
			console.warn(
				'The repeater interface expects an array as value, but the given value is no array. Overriding given value.',
			);
		}

		emitValue([newDefaults]);
		// Expand the first item
		expandedItems.value = [0];

		// Focus the first input after the DOM updates
		nextTick(() => {
			const firstInput = document.querySelector('.list-item-form input, .list-item-form select, .list-item-form textarea');

			if (firstInput instanceof HTMLElement) {
				firstInput.focus();
			}
		});
	}
}

function emitValue(value?: Record<string, unknown>[]) {
	if (!value || value.length === 0) {
		return emit('input', null);
	}

	return emit('input', value);
}

function discardAndLeave() {
	if (itemToRemove.value !== null) {
		performRemoval(itemToRemove.value);
		itemToRemove.value = null;
	}

	confirmDiscard.value = false;
}
</script>

<template>
	<div class="repeater">
		<!-- Empty States -->
		<v-notice v-if="fieldsWithNames.length === 0" type="warning">
			{{ t('no_visible_fields_copy') }}
		</v-notice>
		<v-notice v-else-if="!internalValue?.length">
			{{ t(placeholder) }}
		</v-notice>
		<v-notice v-else-if="!Array.isArray(internalValue)" type="warning">
			{{ t('interfaces.list.incompatible_data') }}
		</v-notice>
		<!-- Main Accordion List -->
		<AccordionRoot v-else v-model="expandedItems" type="multiple">
			<Draggable
				v-if="Array.isArray(internalValue) && internalValue.length > 0"
				tag="v-list"
				:model-value="internalValue"
				:disabled="disabled"
				item-key="id"
				handle=".drag-handle"
				v-bind="{ 'force-fallback': true }"
				class="v-list"
				:class="{ dragging: isDragging }"
				@start="onDragStart"
				@end="onDragEnd"
				@update:model-value="$emit('input', $event)"
			>
				<template #item="{ element, index }">
					<AccordionItem :value="index" as-child>
						<v-list-item block grow class="list-item">
							<div class="list-item-content">
								<AccordionTrigger as-child>
									<button
										type="button"
										class="list-item-header"
										:class="{ 'border-bottom': isExpanded(index) }"
									>
										<div class="list-item-header-controls">
											<v-icon
												v-if="!disabled && !sort"
												name="drag_handle"
												class="drag-handle"
												@click.stop
											/>
											<v-icon
												:name="
													isExpanded(index) ? 'expand_less' : 'chevron_right'
												"
												class="expand-icon"
											/>
										</div>
										<render-template
											:fields="fields"
											:item="{ ...defaults, ...element }"
											:direction="direction"
											:template="templateWithDefaults"
											title="Click to expand form"
											class="list-item-header-content"
										/>
										<v-icon
											v-if="!disabled"
											name="close"
											class="clear-icon"
											clickable
											@click.stop="removeItem(index)"
										/>
									</button>
								</AccordionTrigger>
								<transition-expand>
									<AccordionContent as-child>
										<div class="list-item-form">
											<v-form
												:disabled="disabled"
												:fields="fieldsWithNames"
												:model-value="element"
												:direction="direction"
												primary-key="+"
												@update:model-value="
													(updatedElement: Record<string, unknown>) => {
														const updatedValue = [...internalValue]
														updatedValue[index] = updatedElement
														emitValue(updatedValue)
													}
												"
											/>
										</div>
									</AccordionContent>
								</transition-expand>
							</div>
						</v-list-item>
					</AccordionItem>
				</template>
			</Draggable>
		</AccordionRoot>

		<!-- Action Bar -->
		<div class="action-bar justify-between">
			<v-button v-if="showAddNew" class="add-new" :disabled="disabled" @click="addNew">
				{{ t(addLabel) }}
			</v-button>

			<div v-if="internalValue" class="action-bar">
				<v-button
					v-tooltip="t('collapse_all')"
					:disabled="expandedItems.length === 0"
					icon
					kind="secondary"
					title="Collapse all"
					@click="expandedItems = []"
				>
					<v-icon name="unfold_less" />
				</v-button>

				<v-button
					v-tooltip="t('expand_all')"
					:disabled="expandedItems.length === internalValue.length"
					icon
					kind="secondary"
					title="Expand all"
					@click="
						expandedItems = Array.from(
							{ length: internalValue.length },
							(_, i) => i,
						)
					"
				>
					<v-icon name="unfold_more" />
				</v-button>
			</div>
		</div>

		<!-- Confirm Remove Modal -->
		<v-dialog v-model="confirmDiscard" @esc="confirmDiscard = false">
			<v-card>
				<v-card-title>{{ t('remove_item') }}</v-card-title>
				<v-card-actions>
					<v-button secondary @click="confirmDiscard = false">
						{{
							t('cancel')
						}}
					</v-button>
					<v-button @click="discardAndLeave()">
						{{ t('remove_item') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 0 0 4px;
}

.list-item {
	width: 100%;
	margin-bottom: 8px;

	&:has(.list-item-header:focus-visible):not(:has(.clear-icon:focus-visible)) {
		border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus)) !important;
		outline: var(--focus-ring-width) solid var(--focus-ring-color, var(--theme--primary)) !important;
		outline-offset: var(--focus-ring-offset) !important;
		border-radius: var(--focus-ring-radius) !important;
	}
}

.list-item-header {
	width: 100%;
	display: flex;
	cursor: pointer;
	align-items: center;
	gap: 8px;
	border: none;
	background: none;
	padding: 0;
	transition: opacity 0.2s ease;

	&:focus-visible {
		outline: none !important;
		border-radius: 0 !important;
	}
}

.list-item-header-controls {
	display: flex;
	align-items: center;
	gap: 4px;
}

.list-item-content {
	width: 100%;
}

.list-item-header-content {
	display: inline-flex;
	flex: 1;
}

.list-item-form {
	margin-top: 16px;
	width: 100%;
}

.border-bottom {
	padding-bottom: 8px;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
}

.clear-icon {
	--v-icon-color: var(--theme--form--field--input--foreground-subdued);
	--v-icon-color-hover: var(--theme--danger);
}

.drag-handle {
	cursor: move;
	opacity: 0.5;
	transition: opacity var(--fast) var(--transition);

	&:hover {
		opacity: 1;
	}
}

.action-bar {
	margin-top: 8px;
	display: flex;
	gap: 8px;

	&.justify-between {
		justify-content: space-between;
	}
}
</style>
