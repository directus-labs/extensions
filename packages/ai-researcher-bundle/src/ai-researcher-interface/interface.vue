<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		value: String | null;
		inputPlaceholder: String | null;
		iconLeft?: String | null;
	}>(),
	{
		value: null,
	},
);


const emit = defineEmits<{
  input: [value: string]
}>()


function submitMessage() {
	console.log('Submit message');
	emit('input', '');
}

</script>


<template>
	<v-input 
		:model-value="value"
		:placeholder="inputPlaceholder"
		@update:model-value="$emit('input', $event)"
		@keyup.enter="submitMessage"
	>
		<template v-if="iconLeft" #prepend>
			<v-icon :name="iconLeft" />
		</template>

		<template #append>
			<v-button icon :disabled="!value" @click="submitMessage">
				<v-icon name="send" color="currentColor" />
			</v-button>
		</template>
	</v-input>
</template>
