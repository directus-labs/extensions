<template>
    <input :value="value" @input="handleChange($event.target.value)" />
</template>



<script setup lang="ts">
    defineProps<{ value?: JSON }>();

    const emit = defineEmits(['input']);

    function handleChange(value: string) {
        emit('input', value);
    }
</script>