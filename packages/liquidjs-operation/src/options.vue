<script setup lang="ts">
import { ref, unref, computed, watch } from 'vue';
import { Field, FieldMeta } from '@directus/types';
import { getPublicURL } from './get-root-path';
import type { Options as LiquidOptions } from './api';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type FlexibleFieldMeta = PartialExcept<FieldMeta, 'interface'>;

type FlexibleField = {
	field: string;
	name?: string;
	type?: string;
	meta: FlexibleFieldMeta;
} & Partial<Omit<Field, 'meta'>>;

const props = withDefaults(
	defineProps<{
		value: Partial<LiquidOptions> | null;
	}>(),
	{
		value: () => ({
			mode: 'custom',
			operationMode: 'single',
			data: {},
		}),
	},
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, any>): void;
}>();

const formValues = ref<Partial<LiquidOptions>>({ ...props.value, publicUrl: getPublicURL() });

const mode = computed(() => unref(formValues).mode || 'custom');
const operationMode = computed(() => unref(formValues).operationMode || 'single');
const collection = computed(() => unref(formValues).collection || '');

const staticFields: FlexibleField[] = [
	{
		field: 'mode',
		name: 'Template Mode',
		type: 'string',
		meta: {
			width: 'half',
			note: 'Choose how to provide the Liquid template. Custom Template: write inline. Saved Template: use a template stored in a collection.',
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'Custom Template', value: 'custom' },
					{ text: 'Saved Template', value: 'saved' },
				],
			},
		},
	},
	{
		field: 'operationMode',
		name: 'Operation Mode',
		type: 'string',
		meta: {
			width: 'half',
			note: 'Choose processing mode. Single: render one template with one data object. Batch: render the template multiple times, once for each item in an array of data objects.',
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'Single', value: 'single' },
					{ text: 'Batch', value: 'batch' },
				],
			},
		},
	},
	{
		field: 'publicUrl',
		name: 'PublicUrl',
		type: 'string',
		meta: {
			interface: 'input',
			hidden: true,
			readonly: true,
		},
	},
];

const dynamicFields = computed(() => {
	const fields: FlexibleField[] = [
		{
			field: 'template',
			name: 'Template',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-code',
				hidden: mode.value !== 'custom',
				note: 'Enter your Liquid template here. Use {# #} for output tags instead of {{ }}. All other Liquid tags remain unchanged. Example: `Hello, {# user.name #}! {% if user.admin %}Admin area{% endif %}`',
				options: {
					language: 'htmlmixed',
					template: 'Hello, {# first_name #}! {% if is_admin %}Welcome to the Admin.{% endif %}',
					placeholder: 'Hello, {# first_name #}! {% if is_admin %}Welcome to the Admin.{% endif %}',
				},
			},
		},
		{
			field: 'collection',
			name: 'Collection',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Select the collection containing your saved Liquid templates.',
				interface: 'system-collection',
				hidden: mode.value !== 'saved',
			},
		},
		{
			field: 'item',
			name: 'Item',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Choose the specific template to render from the selected collection.',
				interface: 'collection-item-dropdown',
				options: {
					selectedCollection: collection.value,
					template: '{{subject}}',
					valueField: 'id',
				},
				hidden: mode.value !== 'saved' || !collection.value,
			},
		},
		{
			field: 'fields',
			name: 'Fields',
			type: 'json',
			meta: {
				width: 'half',
				note: 'Choose fields to process and render. Only selected fields appear in output. Ideal for email scenarios with dynamic subject and body.',
				interface: 'system-field-tree',
				options: {
					collectionName: collection.value,
				},
				hidden: mode.value !== 'saved' || !collection.value,
			},
		},
		{
			field: 'accessToken',
			name: 'Access Token',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				note: 'Required for accessing private template collections in `Saved Template` mode. Alternatively, make your template collection public. Ensure the token has read permissions for the template collection.',
				hidden: mode.value !== 'saved',
				options: {
					masked: true,
				},
			},
		},
		{
			field: 'data',
			name: 'Data',
			type: 'json',
			meta: {
				required: true,
				width: 'full',
				note: 'JSON data to populate the template. Format: object for single mode, array of objects for batch mode. Supports mustache syntax for dynamic values, e.g., {"user": "{{$trigger.user}}"}.',
				interface: 'input-code',
				options: {
					language: 'json',
					template: '{"first_name":"John","last_name":"Doe","is_admin":true}',
					placeholder: '{"first_name":"John","last_name":"Doe","is_admin":true}',
				},
			},
		},
		{
			field: 'dataReturnFields',
			name: 'Return Fields from Data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'tags',
				note: 'Specify fields from your input data to include in each output object. Useful for maintaining context or identification (e.g., "id", "name"). These fields will be added alongside the output for each item in batch mode.',
				hidden: operationMode.value !== 'batch',
				options: {
					placeholder: 'Add a field key and press Enter...',
				},
			},
		},
	];

	return fields;
});

const allFields = computed(() => {
	return [...staticFields, ...dynamicFields.value];
});

watch(
	formValues,
	(newValues) => {
		emit('input', newValues);
	},
	{ deep: true },
);

watch(
	() => props.value,
	(newValue) => {
		if (newValue !== null && JSON.stringify(newValue) !== JSON.stringify(formValues.value)) {
			formValues.value = { ...newValue, publicUrl: getPublicURL() };
		}
	},
	{ deep: true },
);
</script>

<template>
	<v-form v-model="formValues" :fields="allFields" primary-key="+" />
</template>
