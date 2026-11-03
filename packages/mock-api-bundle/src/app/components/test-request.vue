<script setup lang="ts">
import { ref, watch } from 'vue';
import { METHODS } from '../../shared/engine';
import { useMockApi } from '../composables/use-mock-api';
import { statusKind } from '../utils/kinds';

const props = defineProps<{ defaultPath: string; defaultMethod: string; dirty?: boolean }>();

const { api } = useMockApi();

const methods = METHODS.map((m) => ({ text: m, value: m }));
const method = ref(props.defaultMethod);
const path = ref(samplePath(props.defaultPath));
const body = ref('');
const sending = ref(false);
const result = ref<{ status: number; ms: number; text: string } | null>(null);
const bodyError = ref<string | null>(null);

watch(
	() => [props.defaultPath, props.defaultMethod],
	() => {
		method.value = props.defaultMethod;
		path.value = samplePath(props.defaultPath);
		result.value = null;
	},
);

function samplePath(value: string) {
	return value
		.replaceAll(/:collection\b/g, 'pages')
		.replaceAll(/:id\b/g, '5')
		.replaceAll(/\/:([a-z_]+)/gi, '/sample')
		.replace(/\/\*$/, '/anything');
}

function pretty(data: unknown) {
	if (data === '' || data == null) return '(no body)';
	if (typeof data === 'string') return data;
	return JSON.stringify(data, null, 2);
}

async function send() {
	bodyError.value = null;

	if (!path.value.startsWith('/') || path.value.startsWith('//')) {
		bodyError.value = 'Enter a path on this project, starting with a single "/".';
		return;
	}

	let data: unknown;

	if (body.value.trim()) {
		try {
			data = JSON.parse(body.value);
		}
		catch {
			bodyError.value = 'The request body is not valid JSON.';
			return;
		}
	}

	sending.value = true;
	const start = performance.now();

	try {
		const response = await api.request({ method: method.value, url: path.value, data, validateStatus: () => true });
		result.value = { status: response.status, ms: Math.round(performance.now() - start), text: pretty(response.data) };
	}
	catch (error: any) {
		result.value = { status: 0, ms: Math.round(performance.now() - start), text: error?.message ?? String(error) };
	}
	finally {
		sending.value = false;
	}
}
</script>

<template>
	<sidebar-detail id="mock-api-test-request" icon="send" title="Test request">
		<div class="test">
			<v-select v-model="method" :items="methods" />
			<v-input v-model="path" class="mono" placeholder="/mock/prefix/path" @keydown.enter="send" />
			<v-textarea v-model="body" class="mono" placeholder="Body, e.g. {&quot;note&quot;: &quot;Check before launch&quot;}" />
			<p v-if="bodyError" class="error">
				{{ bodyError }}
			</p>
			<p v-if="dirty" class="hint">
				Sends to the saved endpoint. Save first to test your changes.
			</p>
			<v-button full-width :loading="sending" @click="send">
				Send
			</v-button>

			<template v-if="result">
				<div class="status">
					<v-chip x-small :kind="statusKind(result.status)">
						{{ result.status || 'Failed' }}
					</v-chip>
					<span class="hint">{{ result.ms }} ms</span>
				</div>
				<pre class="body">{{ result.text }}</pre>
			</template>
		</div>
	</sidebar-detail>
</template>

<style scoped>
.test {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.mono {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
	font-family: var(--theme--fonts--monospace--font-family);
}

.status {
	display: flex;
	align-items: center;
	gap: 8px;
}

.hint {
	color: var(--theme--foreground-subdued);
	font-size: 12px;
	margin: 0;
}

.error {
	color: var(--theme--danger);
	font-size: 12px;
	margin: 0;
}

.body {
	margin: 0;
	padding: 8px;
	max-block-size: 260px;
	overflow: auto;
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 12px;
	background-color: var(--theme--background);
	border: var(--theme--border-width, 1px) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	white-space: pre;
}
</style>
