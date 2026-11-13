<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EXAMPLE, EXAMPLE_PREFIX } from '../../shared/example';
import { BASE_PATH } from '../../shared/tables';
import MockNavigation from '../components/mock-navigation.vue';
import { useMockApi } from '../composables/use-mock-api';

const route = useRoute();
const router = useRouter();
const { api, collections, load, refresh, notify, errorMessage, setupError } = useMockApi();
const addingExample = ref(false);

async function addExample() {
	addingExample.value = true;

	try {
		await api.post(`/${BASE_PATH}/_meta/import`, { file: EXAMPLE, strategy: 'merge' });
		await refresh();
		const example = collections.value.find((c) => c.prefix === EXAMPLE_PREFIX);
		if (example) router.replace(`/mock-api/${example.id}`);
	}
	catch (error) {
		notify(errorMessage(error), 'error');
	}
	finally {
		addingExample.value = false;
	}
}

onMounted(async () => {
	const startPath = route.fullPath;
	await load();
	const first = collections.value[0];
	if (first && route.fullPath === startPath) router.replace(`/mock-api/${first.id}`);
});
</script>

<template>
	<private-view title="Mock API" icon="api">
		<template #navigation>
			<MockNavigation />
		</template>
		<div class="content">
			<v-notice v-if="setupError" type="danger">
				{{ setupError }}
			</v-notice>
			<v-info v-else-if="collections.length === 0" icon="api" title="Mock API" center>
				Create a collection to group mock endpoints under one URL prefix, or start from an example tasks API.
				<template #append>
					<div class="actions">
						<v-button secondary :loading="addingExample" @click="addExample">
							Add example
						</v-button>
						<v-button to="/mock-api/+">
							New collection
						</v-button>
					</div>
				</template>
			</v-info>
		</div>
	</private-view>
</template>

<style scoped>
.content {
	padding-inline: var(--content-padding);
	padding-block: var(--content-padding) var(--content-padding-bottom);
}

.actions {
	display: flex;
	gap: 8px;
}
</style>
