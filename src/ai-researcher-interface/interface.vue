<template>
  <h1 class="title">Research Prompt</h1>
  <VInput v-model="prompt" id="prompt"/>
  <VButton @click="fetchData()" class="open-api-input">
    Research
  </VButton>
  <VTextarea class="answer" readonly v-model="answer" />
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
  systemprompt: {
    type: String,
    required: true,
  },
});

async function fetchData() {
  const response = await api.post('/ai-researcher-endpoint/openai', {
    userprompt: prompt.value,
    systemprompt: props.systemprompt,
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

  .title {
    margin: 2em auto;
  }

  .v-textarea {
    background-color: #d1d1d1;
  }
</style>