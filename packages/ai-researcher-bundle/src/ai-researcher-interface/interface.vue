<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { useSdk, useStores } from '@directus/extensions-sdk';
import ChatMessage from './components/chat-message.vue';
import type { Message } from '../_shared/types';


const props = withDefaults(
	defineProps<{
		value: string | null;
		inputPlaceholder: string | null;
		iconLeft?: string | null;
		aiProvider?: string | null;
		aiModel?: string | null;
		apiKeyOpenAi?: string | null;
		apiKeyAnthropic?: string | null;
	}>(),
	{
		value: null,
		inputPlaceholder: 'Ask a question... / Ask a follow-up...',
	},
);


const emit = defineEmits<{
  input: [value: string]
}>()


const loading = ref(false);
const streamResponse = ref('');
const messageBackup = ref(null as string | null);
const showMessages = ref(false);
const messages = reactive([] as Message[]);

const client = useSdk();
const { useNotificationsStore } = useStores();
const notificationStore = useNotificationsStore();	

const aiKey = computed(() => {
	if (props.aiProvider === 'openai' && props.apiKeyOpenAi) {
		return props.apiKeyOpenAi;
	}
	if (props.aiProvider === 'anthropic' && props.apiKeyAnthropic) {
		return props.apiKeyAnthropic;
	}
	return null;
});


async function submitMessage() {
	messageBackup.value = props.value;
	emit('input', '');
	loading.value = true;
	streamResponse.value = '';

	try {
		const response = await client.request(() => ({
			path: '/ai-researcher/chat/completions',
			method: 'POST',
			headers: {
        'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				aiProvider: props.aiProvider,
				aiModel: props.aiModel,
				aiKey: aiKey.value,
				userMessage: messageBackup.value,
				messages: messages,
      })
		})) as any;

		const reader = response!.body?.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader!.read();

			if (done) {
				break;
			}

			const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

			lines.forEach(line => {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          const { content } = JSON.parse(data);
          streamResponse.value = `${streamResponse.value}${content}`;
        }
      });
		}

		messages.push(
			{
				role: 'user',
				content: messageBackup.value || '',
			},
			{
				role: 'assistant',
				content: streamResponse.value,
			}
		);
	} catch (error: any) {
		emit('input', messageBackup.value || '');

		notificationStore.add({
			type: 'error',
			title: error.errors?.[0].message || error.message || 'AI Request failed',
		});
	} finally {
		loading.value = false;
		messageBackup.value = null;
	}
}

function clearMessages() {
	messages.splice(0);
	streamResponse.value = '';
}

</script>


<template>
	<template v-if="!props.aiProvider || !props.aiModel">
		<v-notice type="warning">
			Please select an AI provider and model in the interface settings in order to use the AI Researcher
		</v-notice>
	</template>

	<template v-else>
		<div class="input-row">
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

			<v-button 
				icon
				x-large
				secondary
				:disabled="!messages.length" 
				@click="showMessages = true"
			>
				<v-icon name="forum" :color="messages.length ? 'var(--theme--primary)' : 'inherit'" />
			</v-button>
		</div>

		<v-overlay :active="showMessages" clickable @click="showMessages = false">
			<v-card class="chat-context">
				<v-card-title>
					Chat messages
				</v-card-title>

				<v-card-text>
					<div class="chat-messages">
						<chat-message v-for="message in messages" :message="message" />
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="clearMessages">Clear</v-button>
					<v-button @click="showMessages = false">Close</v-button>
				</v-card-actions>
			</v-card>
		</v-overlay>
		

		<template v-if="streamResponse">
			 <chat-message class="chat-response" :message="{ role: 'assistant', content: streamResponse }" />
		</template>
		
	</template>
</template>


<style lang="scss" scoped>
.input-row {
	display: flex;
	gap: 1rem;
}

.chat-context {
	max-width: 800px;
	
	.chat-messages {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
}

.chat-response {
	margin-top: 1rem;
}
</style>
