<script setup lang="ts">
import { CommandEmpty } from "../../primitives/cmdk";
import Item from "./item.vue";
</script>

<template>
  <Item :as="CommandEmpty" icon="search">
    <slot>No results found</slot>
  </Item>
</template>
