<template>
	<input :value="value" @input="handleChange($event.target.value)" />
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script> 
export default {
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		return { handleChange };

		function handleChange(value) {
			emit('input', value);
		}
	},
};
</script>
<!-- <script setup>
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

async function fetchData() {
    const response = await api.get('ENDPOINT_URL');
    data.value = response.data;
};
fetchData();
</script> -->
