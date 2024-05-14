<template>
  <h1>Prompt</h1>
  <VInput v-model="prompt" id="prompt"/>
  <VButton @click="fetchData()" class="open-api-input">
    Create New
  </VButton>
  <VTextarea v-model="answer" />
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

const answer = ref("");
const prompt = ref(""); // setstate in react

const props = defineProps({
  apiKey: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: null,
  },
});

async function fetchData() {
  const response = await api.post('/ai-researcher-endpoint/openai', {
    prompt: prompt.value,
    role: props.role,
  },
  {
    headers: {
      apikey: props.apiKey,
    },
  },
  );

  answer.value = response.data.content;
};
</script>

<style scoped lang="scss">
  .divider {
    margin: 1em auto;
  }

  .open-api-input {
    margin: 2em auto;
  }
</style>