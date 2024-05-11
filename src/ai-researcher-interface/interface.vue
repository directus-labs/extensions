<template>
  <h1>Open API</h1>
  <VInput v-bind="value" class="open-api-input" />
  <VDivider class="divider"/>
  <h1>Prompt</h1>
  <VInput v-bind="value" id="prompt"/>
  <VButton @click="fetchData()" class="open-api-input">
    Create New
  </VButton>
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

const foo = () => {
  console.log('dgl hello');
}

async function fetchData() {
  console.log('dgl fetchData');
  const response = await api.get('/');
  console.log(response.data);
  // data.value = response.data;
  // console.log(data.value);
};
</script> -->
<style scoped lang="scss">
  .divider {
    margin: 1em auto;
  }

  .open-api-input {
    margin: 2em auto;
  }
</style>