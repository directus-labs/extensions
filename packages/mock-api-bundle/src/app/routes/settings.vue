<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { BASE_PATH, SETTINGS } from '../../shared/tables';
import MockNavigation from '../components/mock-navigation.vue';
import { useMockApi } from '../composables/use-mock-api';

const { api, load, notify, errorMessage, setupError } = useMockApi();

const item = ref<Record<string, any> | null>(null);
const edits = ref<Record<string, any>>({});
const saving = ref(false);
const fetchError = ref<string | null>(null);
const hasEdits = computed(() => Object.keys(edits.value).length > 0);

async function fetchSettings() {
	try {
		item.value = (await api.get(`/items/${SETTINGS}`)).data.data ?? {};
		fetchError.value = null;
	}
	catch (error) {
		fetchError.value = errorMessage(error);
	}
}

async function save() {
	saving.value = true;

	try {
		await api.patch(`/items/${SETTINGS}`, edits.value);
		edits.value = {};
		await fetchSettings();
		notify('Settings saved');
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
	finally {
		saving.value = false;
	}
}

onMounted(async () => {
	await load();
	if (!setupError.value) await fetchSettings();
});
</script>

<template>
	<private-view title="Settings" icon="tune">
		<template #navigation>
			<MockNavigation />
		</template>

		<template #actions>
			<v-button v-tooltip.bottom="'Save'" icon :loading="saving" :disabled="!hasEdits" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="content">
			<v-notice v-if="setupError || fetchError" type="danger">
				{{ setupError ?? fetchError }}
			</v-notice>
			<v-form
				v-else-if="item"
				v-model="edits"
				:collection="SETTINGS"
				:initial-values="item"
				:primary-key="item.id ?? '+'"
			/>
		</div>

		<template #sidebar>
			<sidebar-detail id="mock-api-settings-info" icon="info" title="About">
				<p class="hint">
					Mocks are served at /{{ BASE_PATH }}/&lt;collection prefix&gt;/&lt;endpoint path&gt;.
				</p>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.content {
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
	max-inline-size: 800px;
}

.hint {
	margin: 0;
	color: var(--theme--foreground-subdued);
	word-break: break-all;
}
</style>
