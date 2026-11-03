<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { BASE_PATH } from '../../shared/tables';
import MockNavigation from '../components/mock-navigation.vue';
import { useMockApi } from '../composables/use-mock-api';
import { methodKind, statusKind } from '../utils/kinds';

const { api, load, notify, errorMessage } = useMockApi();

interface LogEntry {
	time: string;
	method: string;
	path: string;
	status: number;
	answered_by: string | null;
}

const entries = ref<LogEntry[]>([]);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const headers = [
	{ text: 'Time', value: 'time', width: 120 },
	{ text: 'Method', value: 'method', width: 110 },
	{ text: 'Path', value: 'path', width: 420 },
	{ text: 'Status', value: 'status', width: 100 },
	{ text: 'Answered by', value: 'answered_by', width: 260 },
];

const time = (iso: string) =>
	new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

async function fetchLog() {
	try {
		entries.value = (await api.get(`/${BASE_PATH}/_meta/log`)).data.data;
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
}

async function clearLog() {
	await api.delete(`/${BASE_PATH}/_meta/log`);
	entries.value = [];
}

onMounted(async () => {
	loading.value = true;
	await load();
	await fetchLog();
	loading.value = false;
	timer = setInterval(fetchLog, 3000);
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});
</script>

<template>
	<private-view title="Request log" icon="receipt_long">
		<template #navigation>
			<MockNavigation />
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="'Clear log'" icon secondary :disabled="entries.length === 0" @click="clearLog">
				<v-icon name="delete_sweep" />
			</v-button>
		</template>

		<div class="content">
			<v-info v-if="!loading && entries.length === 0" icon="receipt_long" title="No requests yet" center>
				Requests to /{{ BASE_PATH }}/… show up here, newest first.
			</v-info>

			<v-table
				v-else
				:headers="headers"
				:items="entries"
				item-key="time"
				:loading="loading"
				:clickable="false"
				fixed-header
			>
				<template #[`item.time`]="{ item }">
					<span class="subdued">{{ time(item.time) }}</span>
				</template>
				<template #[`item.method`]="{ item }">
					<v-chip x-small :kind="methodKind(item.method)">
						{{ item.method }}
					</v-chip>
				</template>
				<template #[`item.path`]="{ item }">
					<span class="mono">{{ item.path }}</span>
				</template>
				<template #[`item.status`]="{ item }">
					<v-chip x-small :kind="statusKind(item.status)">
						{{ item.status }}
					</v-chip>
				</template>
				<template #[`item.answered_by`]="{ item }">
					<span class="subdued">{{ item.answered_by ?? 'No match' }}</span>
				</template>
			</v-table>
		</div>

		<template #sidebar>
			<sidebar-detail id="mock-api-log-info" icon="info" title="About the log">
				<p class="hint">
					The last 50 requests that reached the mock router. Kept in memory, so it empties when the API restarts.
					Refreshes every few seconds.
				</p>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.content {
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
}

.subdued,
.hint {
	color: var(--theme--foreground-subdued);
}

.hint {
	margin: 0;
}
</style>
