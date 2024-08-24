<script setup lang="ts">
import { ref, unref, reactive, computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';

type Value = {
	flowId: string | null;
	text?: string;
	icon?: string;
	collection?: string;
	keys?: string;
};

const props = withDefaults(
	defineProps<{
		value: Value | null;
		nested?: boolean;
	}>(),
	{
		value: null,
		nested: false,
	},
);

const emit = defineEmits(['input']);

const { useFlowsStore, useCollectionsStore } = useStores();
const flowsStore = useFlowsStore();
const collectionsStore = useCollectionsStore();

const internalValue = reactive<Value>(props.value ?? { flowId: null });

const manualFlows = flowsStore.flows.filter(({ trigger }) =>
	trigger === 'manual'
);

const selectedFlow = ref<any>(
	manualFlows.find(({ id }) => id === internalValue.flowId)
);

const collections = computed(() => {
	let collections = collectionsStore.collections;

	if (selectedFlow.value) {
		const flow = selectedFlow.value;
		const keep = new Set(flow.options?.collections ?? []);
		collections = collections.filter(({ collection }) => keep.has(collection));
	}

	return collections
		.filter((collection) => collection.type !== 'alias')
		.map((collection) => ({
			text: collection.name,
			value: collection.collection,
		}));
});

const fields = computed(() => {
	const flow = unref(selectedFlow);
	const requireSelection = flow.options?.requireSelection !== false;
	return [
		{
			field: 'flowId',
			name: 'Flow',
			type: 'string',
			meta: {
				required: true,
				width: 'full',
				interface: 'select-dropdown',
				options: {
					placeholder: 'Select a Flow',
					choices: manualFlows,
					itemValue: 'id',
					itemText: 'name',
					itemIcon: 'icon',
					itemColor: 'color',
				},
			},
		} as any,
	].concat(internalValue.flowId ? [
		{
			field: 'collection',
			name: 'Collection',
			type: 'string',
			meta: {
				required: requireSelection,
				width: 'half',
				interface: 'select-dropdown',
				options: {
					placeholder: 'Select a Collection',
					choices: collections.value,
					disabled: (collections.value.length === 0),
				},
			},
		},
		{
			field: 'keys',
			name: 'IDs',
			type: 'csv',
			meta: {
				required: requireSelection,
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'vpn_key',
				},
			},
		},
		{
			field: 'text',
			name: 'Button Text',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: 'Button Text',
				},
			},
		},
		{
			field: 'icon',
			name: 'Button Icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
	] : []);
});

function updateInternalValue(value: Value) {
	const { flowId } = value;

	const flowChanged = internalValue.flowId !== flowId;

	internalValue.flowId = flowId;

	if (flowChanged) {
		const flow = unref(manualFlows).find(({ id }) => id === flowId);

		internalValue.text = flow.name;
		internalValue.icon = flow.icon;

		selectedFlow.value = flow;
	} else {
		internalValue.text = value.text;
		internalValue.icon = value.icon;
	}

	internalValue.collection = value.collection;
	internalValue.keys = value.keys;

	emit('input', internalValue);
}
</script>

<template>
	<v-form
		class="system-flow-trigger-form"
		v-bind:class="{ nested: props.nested }"
		:model-value="internalValue"
		:fields="fields"
		@update:model-value="updateInternalValue"
	/>
</template>

<style scoped>
.system-flow-trigger-form.nested :deep(.field.first-visible-field .field-label) {
	display: none;
}
</style>
