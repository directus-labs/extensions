<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Field, FieldMeta } from '@directus/types';
import { emails, domains, apiKeys, audiences, contacts } from './endpoints';
import { resendLogo } from './resend-logo.ts'
import type { Options as ResendOptions } from './api';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

type FlexibleFieldMeta = PartialExcept<FieldMeta, 'interface'>;

type FlexibleField = {
	field: string;
	name?: string;
	type?: string;
	meta: FlexibleFieldMeta;
} & Partial<Omit<Field, 'meta'>>;

const endpoints = {
	emails,
	domains,
	apiKeys,
	audiences,
	contacts,
};

const props = withDefaults(
	defineProps<{
		value: ResendOptions;
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

const formValues = ref<ResendOptions>(props.value);

const endpoint = computed(() => formValues.value.endpoint || '');
const action = computed(() => formValues.value.action || '');

const actionChoices = computed(() => {
	const selectedEndpoint = endpoints[endpoint.value as keyof typeof endpoints];
	if (!selectedEndpoint) return [];

	return Object.entries(selectedEndpoint.actions).map(([key, value]) => ({
		text: value.label,
		value: key,
		icon: value.icon,
	}));
});

const staticFields: FlexibleField[] = [
{
            field: "info",
            type: "alias",
            meta: {
                width: "full",
                interface: "presentation-notice",

                options: {
                    icon: false,
                    text: `${resendLogo}<span style="padding-left: 16px">Email API for developers. Learn more and get started at <a href="https://resend.com?ref=directus_marketplace" target="_blank">resend.com</a>.</span>`,
                },
            },
        },
	{
		field: 'apiKey',
		name: 'API Key',
		type: 'string',
		meta: {
			interface: 'input',
			note: 'The API key for your Resend account. You can find this in the Resend dashboard under [Account > API Keys.](https://resend.com/api-keys)',
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
			note: 'The endpoint to call. Check the [Resend API documentation](https://resend.com/docs/api-reference) for more information.',
			options: {
				choices: [
					{ text: 'Emails', value: 'emails', icon: 'mail' },
					{ text: 'Domains', value: 'domains', icon: 'domain' },
					{ text: 'API Keys', value: 'apiKeys', icon: 'key' },
					{ text: 'Audiences', value: 'audiences', icon: 'group' },
					{ text: 'Contacts', value: 'contacts', icon: 'person' },
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
				choices: actionChoices,
			},
		},
	},
];

const dynamicFields = computed(() => {
	if (!endpoint.value || !action.value) return [];

	const selectedEndpoint = endpoints[endpoint.value as keyof typeof endpoints];
	if (!selectedEndpoint) return [];

	return selectedEndpoint.actions[action.value]?.options || [];
});

const allFields = computed(() => {
	return [...staticFields, ...dynamicFields.value];
});

watch(
	formValues,
	(newValues) => {
		console.log('Form values changed:', newValues);
		emit('input', newValues);
	},
	{ deep: true },
);

watch(
	() => props.value,
	(newValue) => {
		if (newValue !== null && JSON.stringify(newValue) !== JSON.stringify(formValues.value)) {
			formValues.value = { ...newValue };
		}
	},
	{ deep: true },
);



</script>

<template>
	<v-form v-model="formValues" :fields="allFields" primary-key="+" />
</template>
