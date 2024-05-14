<template>
  <h1>Prompt</h1>
  <VInput v-model="prompt" id="prompt"/>
  <VButton @click="fetchData()" class="open-api-input">
    Create New
  </VButton>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';

const api = useApi();

const prompt = ref(""); // setstate in react
const answer = ref("");

const props = defineProps({
  systemPrompt: {
    type: String,
    default: null,
  },
  apiKey: {
    type: String,
    required: true,
  },
});

async function fetchData() {
  console.log(props);
  // prompt.value, props.systemPrompt, props.apiKey needed
  // answer.value to be filled

  const response = await api.post('/ai-researcher-endpoint/openai', {
    prompt: prompt.value,
    systemPrompt: props.systemPrompt,
  },
  {
    headers: {
      apikey: props.apiKey,
    },
  },
  );
  // console.log(response.data);
};
</script>