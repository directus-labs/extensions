<script setup lang="ts">

import ResultItem from './result-item.vue';
</script>

<template>
<result-item class="no-results" icon="search">
  <template #title>
    No results found
  </template>
</result-item>
</template>
