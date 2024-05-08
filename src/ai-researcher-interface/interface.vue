<template>
  <VInput v-bind="value" />
  <VInput v-bind="value" />
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
      console.log("dgl hello world");
      emit('input', value);
		}
	},
};
</script>
<!-- <script setup>
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

async function fetchData() {
    const response = await api.get('/');
    data.value = response.data;
};

fetchData();
</script> -->
