<script setup lang="ts">
import type { ImportPlan, ImportStrategy } from '../../shared/transfer';
import { computed, onMounted, ref, watch } from 'vue';
import { EXAMPLE } from '../../shared/example';
import { BASE_PATH } from '../../shared/tables';
import { describePlan } from '../../shared/transfer';
import MockNavigation from '../components/mock-navigation.vue';
import { useMockApi } from '../composables/use-mock-api';

const { api, collections, load, refresh, notify, errorMessage } = useMockApi();

const selected = ref<number[]>([]);
const exporting = ref(false);

const fileName = ref<string | null>(null);
const fileText = ref('');
const strategy = ref<ImportStrategy>('merge');
const plan = ref<ImportPlan | null>(null);
const planError = ref<string | null>(null);
const importing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const strategies: { value: ImportStrategy; label: string; description: string }[] = [
	{
		value: 'merge',
		label: 'Update and add',
		description:
			'Endpoints in the file overwrite yours with the same method and path. New ones are added. Your other endpoints stay.',
	},
	{
		value: 'replace',
		label: 'Replace mine',
		description: 'Your collection is deleted and the imported one takes its place.',
	},
	{
		value: 'copy',
		label: 'Import as a copy',
		description: 'Yours stays untouched. The imported collection is added with a new prefix.',
	},
];

const canImport = computed(() => plan.value !== null && !planError.value && !importing.value);

async function exportFile() {
	exporting.value = true;

	try {
		const response = await api.get(`/${BASE_PATH}/_meta/export`, {
			params: { collections: selected.value.join(',') },
		});
		const prefixes = collections.value
			.filter((c) => selected.value.includes(c.id))
			.map((c) => c.prefix)
			.join('-');
		const blob = new Blob([`${JSON.stringify(response.data, null, 2)}\n`], { type: 'application/json' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `mock-api-${prefixes || 'export'}.json`;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
	finally {
		exporting.value = false;
	}
}

function chooseFile() {
	fileInput.value?.click();
}

async function onFile(event: Event) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	input.value = '';
	fileName.value = file.name;
	fileText.value = await file.text();
}

function useExample() {
	fileText.value = JSON.stringify(EXAMPLE, null, '\t');
	fileName.value = 'Example: Tasks API (ships with the extension)';
}

async function preview() {
	plan.value = null;
	planError.value = null;
	if (!fileText.value.trim()) return;

	try {
		const response = await api.post(`/${BASE_PATH}/_meta/import`, {
			file: fileText.value,
			strategy: strategy.value,
			dry_run: true,
		});
		plan.value = response.data.data;
	}
	catch (error) {
		planError.value = errorMessage(error);
	}
}

async function runImport() {
	importing.value = true;

	try {
		await api.post(`/${BASE_PATH}/_meta/import`, { file: fileText.value, strategy: strategy.value });
		await refresh();
		notify('Import complete');
		fileText.value = '';
		fileName.value = null;
		plan.value = null;
	}
	catch (error) {
		planError.value = errorMessage(error);
	}
	finally {
		importing.value = false;
	}
}

watch([fileText, strategy], preview);

onMounted(async () => {
	await load();
	selected.value = collections.value.map((c) => c.id);
});
</script>

<template>
	<private-view title="Import and export" icon="swap_vert">
		<template #navigation>
			<MockNavigation />
		</template>

		<div class="content">
			<div class="form">
				<div class="divider">
					Export
				</div>

				<div class="field">
					<div class="label">
						Collections
					</div>
					<div class="checks">
						<v-checkbox v-for="c in collections" :key="c.id" v-model="selected" :value="c.id" :label="c.name" block />
					</div>
					<small class="note">Writes one JSON file with these collections, their endpoints and their responses.</small>
					<div>
						<v-button :loading="exporting" :disabled="selected.length === 0" @click="exportFile">
							<v-icon name="download" left />
							Export file
						</v-button>
					</div>
				</div>

				<div class="divider">
					Import
				</div>

				<div class="field">
					<div class="label">
						File
					</div>
					<button type="button" class="dropzone" @click="chooseFile">
						<v-icon name="upload_file" large />
						<span>{{ fileName ?? 'Choose an export file' }}</span>
						<small class="note">A .json file from another developer's export</small>
					</button>
					<input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onFile">
					<div>
						<v-button secondary small @click="useExample">
							<v-icon name="auto_awesome" left small />
							Use the example
						</v-button>
					</div>
				</div>

				<div class="field">
					<div class="label">
						Or paste the file's contents
					</div>
					<v-textarea v-model="fileText" class="mono" placeholder="{ &quot;format&quot;: &quot;directus-mock-api&quot;, … }" />
				</div>

				<div class="field">
					<div class="label">
						When a collection with the same prefix already exists
					</div>
					<div class="radios">
						<label v-for="s in strategies" :key="s.value" class="radio">
							<v-radio v-model="strategy" :value="s.value" :label="s.label" />
							<small class="note">{{ s.description }}</small>
						</label>
					</div>
				</div>

				<v-notice v-if="planError" type="danger">
					{{ planError }}
				</v-notice>
				<v-notice v-else-if="plan" icon="fact_check">
					Importing will result in: {{ describePlan(plan) }}
				</v-notice>

				<div>
					<v-button :loading="importing" :disabled="!canImport" @click="runImport">
						<v-icon name="upload" left />
						Import
					</v-button>
				</div>
			</div>
		</div>

		<template #sidebar>
			<sidebar-detail id="mock-api-transfer-info" icon="info" title="Sharing a spec update">
				<p class="hint">
					When the backend spec changes, one developer updates the mocks and exports them. Everyone else imports the
					file with "Update and add". Endpoints they added themselves stay in place.
				</p>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.content {
	padding: var(--content-padding);
	padding-block: 0 var(--content-padding-bottom);
}

.form {
	display: flex;
	flex-direction: column;
	gap: 28px;
	max-inline-size: 800px;
}

.divider {
	display: flex;
	align-items: center;
	gap: 12px;
	color: var(--theme--foreground-accent, var(--theme--foreground));
	font-weight: 700;
	font-size: 16px;
}

.divider::after {
	content: '';
	flex: 1;
	block-size: var(--theme--border-width, 1px);
	background-color: var(--theme--border-color);
}

.field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.label {
	font-weight: 600;
	color: var(--theme--foreground-accent, var(--theme--foreground));
}

.note,
.hint {
	color: var(--theme--foreground-subdued);
}

.hint {
	margin: 0;
}

.checks {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 8px;
}

.radios {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.radio {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.radio .note {
	padding-inline-start: 32px;
}

.dropzone {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 24px;
	border: 2px dashed var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
	color: var(--theme--foreground-subdued);
	cursor: pointer;
	font: inherit;
}

.dropzone:hover {
	border-color: var(--theme--primary);
	color: var(--theme--primary);
}

.mono {
	--v-textarea-font-family: var(--theme--fonts--monospace--font-family);
	font-family: var(--theme--fonts--monospace--font-family);
}
</style>
