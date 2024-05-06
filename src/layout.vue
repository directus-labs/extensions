<template>
    <div>
        <p>Name: {{ name }}</p>
        <p>Collection: {{ collection }}</p>
    </div>
</template>



<script setup lang="ts">
    defineOptions({ inheritAttrs: false });

    defineProps<{
        collection: string;
        name: string;
    }>();
</script>