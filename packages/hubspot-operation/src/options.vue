<script setup lang="ts">
import type { DynamicField, HubSpotOptions } from './types';
import { computed, ref, watch } from 'vue';
import { activities, calls, communications, companies, contacts, deals, email, leads, meetings, notes, products, tasks, tickets } from './endpoints';

const props = withDefaults(
	defineProps<{
		value: HubSpotOptions;
	}>(),
	{
		value: () => ({
			apiKey: '',
			endpoint: '',
			action: '',
		}),
	},
);

const emit = defineEmits<{
	(e: 'input', value: Record<string, any>): void;
}>();

const endpoints = {
	activities,
	calls,
	communications,
	companies,
	contacts,
	deals,
	email,
	leads,
	meetings,
	notes,
	products,
	tasks,
	tickets,
};

const operationValues = ref<HubSpotOptions>(props.value);

const endpoint = computed(() => operationValues.value.endpoint || '');
const action = computed(() => operationValues.value.action || '');

const endpointActions = computed(() => {
	const operationEndpoint = endpoints[endpoint.value as keyof typeof endpoints];
	if (!operationEndpoint)
		return [];

	return Object.entries(operationEndpoint.actions).map(([key, value]) => ({
		text: value.label,
		value: key,
		icon: value.icon,
	}));
});

const defaultFields: DynamicField[] = [
	{
		field: 'info',
		type: 'alias',
		meta: {
			width: 'full',
			interface: 'presentation-notice',
			options: {
				icon: false,
				text: `Learn more and get started at the <a href="https://developers.hubspot.com/" target="_blank">HubSpot Developer Portal</a>. Make sure to document your unique schema from HubSpot to ensure your properties are valid during API calls. See <a href="https://knowledge.hubspot.com/get-started/manage-your-crm-database" target="_blank">Manage your CRM database.</a>`,
			},
		},
	},
	{
		field: 'apiKey',
		name: 'API Key',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'The API key for your [HubSpot Private App](https://developers.hubspot.com/beta-docs/guides/apps/private-apps/overview).',
			options: {
				masked: true,
			},
		},
	},
	{
		field: 'endpoint',
		name: 'Endpoint',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'select-dropdown',
			note: 'The endpoint to call. Check the [HubSpot API documentation](https://developers.hubspot.com/) for more information.',
			options: {
				choices: [
					{ text: 'Activities', value: 'activities', icon: 'mail' },
					{ text: 'Calls', value: 'calls', icon: 'call' },
					{ text: 'Communications', value: 'communications', icon: 'chat_bubble' },
					{ text: 'Companies', value: 'companies', icon: 'domain' },
					{ text: 'Contacts', value: 'contacts', icon: 'person' },
					{ text: 'Deals', value: 'deals', icon: 'handshake' },
					{ text: 'Email', value: 'email', icon: 'mail' },
					{ text: 'Meetings', value: 'meetings', icon: 'meeting_room' },
					{ text: 'Notes', value: 'notes', icon: 'sticky_note_2' },
					{ text: 'Products', value: 'products', icon: 'shopping_bag' },
					{ text: 'Tasks', value: 'tasks', icon: 'check_box' },
					{ text: 'Tickets', value: 'tickets', icon: 'support_agent' },
				],
			},
		},
	},
	{
		field: 'action',
		name: 'Action',
		type: 'string',
		meta: {
			width: 'half',
			note: 'The action to perform via the API.',
			interface: 'select-dropdown',
			options: {
				choices: endpointActions,
			},
		},
	},
];

const endpointOptions = computed(() => {
	if (!endpoint.value || !action.value)
		return [];

	const operationEndpoint: Record<string, any> = endpoints[endpoint.value as keyof typeof endpoints];
	if (!operationEndpoint)
		return [];

	return operationEndpoint.actions[action.value]?.options || [];
});

const operationFields = computed(() => {
	return [...defaultFields, ...endpointOptions.value];
});

watch(
	operationValues,
	(newVal: Record<string, any>, oldVal: Record<string, any>) => {
		newVal.action = oldVal.endpoint == newVal.endpoint ? newVal.action : null;
		emit('input', newVal);
	},
	{ deep: true },
);

watch(
	() => props.value,
	(newVal) => {
		if (newVal !== null && JSON.stringify(newVal) !== JSON.stringify(operationValues.value)) {
			operationValues.value = { ...newVal };
		}
	},
	{ deep: true },
);
</script>

<template>
	<v-form v-model="operationValues" :fields="operationFields" primary-key="+" />
</template>
