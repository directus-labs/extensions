<script setup lang="ts">
import type { Message } from '../../_shared/types';

defineProps<{
	message: Message
}>()
</script>


<template>
	<div :class="`chat-message ${message.role}`">
		<v-avatar>
			<v-icon :name="message.role === 'user' ? 'person' : 'robot'" />
		</v-avatar>

		<pre class="message-content">{{ message.content }}</pre>
	</div>
</template>

<style scoped lang="scss">
.chat-message {
	display: flex;
	gap: 1rem;
	align-items: flex-end;

	.message-content {
		border-radius: 1.5rem;
		padding: 12px 1rem;
		background-color: var(--theme--background-normal)
	}

	&.user {
		flex-direction: row-reverse;

		.message-content {
			background-color: var(--theme--primary-background);
			border-bottom-right-radius: 0px;
		}
	}

	&.assistant {
		.message-content {
			border-bottom-left-radius: 0px;
		}
	}
}

:deep(.v-avatar) {
	flex-shrink: 0;
}
</style>