<script setup lang="ts">
import type { ValidationError } from '@directus/types';
import type { Ref } from 'vue';
import type { SearchConfigType } from './types';
import { useStores } from '@directus/extensions-sdk';
import { useMagicKeys } from '@vueuse/core';
import { clone, merge } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ZodError } from 'zod';
import SearchNavigation from './components/navigation.vue';

import { useIsAdmin } from './composables/use-is-admin';
import { fields } from './settings-fields';
import { defaultSettings, ModuleSettings } from './types';
import { zodErrorToValidationErrors } from './utils/errors';

const { t } = useI18n();
const { useSettingsStore, useFieldsStore } = useStores();

const fieldsStore = useFieldsStore();
const settingsStore = useSettingsStore();

const isAdmin = useIsAdmin();

const globalSearchSettings = computed(
	() => settingsStore.settings.command_palette_settings,
);

const globalSearchSettingsField = fieldsStore.getField(
	'directus_settings',
	'command_palette_settings',
);

const initialValues = ref(
	clone(settingsStore.settings.command_palette_settings),
);

const edits: Ref<Partial<SearchConfigType> | null> = ref(null);

const hasEdits = computed(() => {
	return edits.value !== null && Object.keys(edits.value).length > 0;
});

const saving = ref(false);
const validationErrors = ref<ValidationError[]>([]);

async function updateSearchSettings(value: SearchConfigType) {
	if (!value)
		return;
	validationErrors.value = [];
	saving.value = true;

	try {
		const result = ModuleSettings.parse(merge({}, initialValues.value, value));

		await settingsStore.updateSettings({
			command_palette_settings: result,
		});

		await settingsStore.hydrate();
		edits.value = null;
		saving.value = false;

		initialValues.value = clone(
			settingsStore.settings.command_palette_settings,
		);
	}
	catch (error) {
		if (error instanceof ZodError) {
			validationErrors.value = zodErrorToValidationErrors(
				error,
				'command_palette_settings',
			);
		}

		saving.value = false;
	}
}

async function createGlobalSearchSettings() {
	if (globalSearchSettingsField)
		return;

	try {
		await fieldsStore.createField('directus_settings', {
			type: 'json',
			meta: {
				interface: 'input-code',
				special: ['cast-json'],
				display: 'raw',
			},
			field: 'command_palette_settings',
			schema: {
				default_value: {},
			},
		});

		await updateSearchSettings(defaultSettings);
		await settingsStore.hydrate();

		initialValues.value = clone(
			settingsStore.settings.command_palette_settings,
		);
	}
	catch (error) {
		console.error(error);
		// @TODO: Handle error
	}
}

// Cmd + S to save
const { meta, s } = useMagicKeys();

watch([meta, s], ([mVal, sVal]) => {
	if (mVal && sVal && hasEdits.value) {
		// @TODO: Fix this type error
		updateSearchSettings(edits.value as any);
	}
});
</script>

<template>
	<private-view title="Settings">
		<!-- Header Icon -->
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="search" />
			</v-button>
		</template>

		<!-- Navigation -->
		<template #navigation>
			<SearchNavigation />
		</template>

		<template #headline>
			<v-breadcrumb
				:items="[
					{ name: 'Global Search', to: { name: 'global-search-index' } },
				]"
			/>
		</template>

		<!-- Actions -->
		<template #actions>
			<v-button
				v-tooltip.bottom="hasEdits ? t('save') : t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!hasEdits"
				@click="updateSearchSettings(edits)"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<!-- Main Content -->
		<main class="container">
			<template v-if="globalSearchSettings">
				<section v-if="!isAdmin">
					<v-info icon="block" title="Unauthorized Access" type="danger" center>
						You do not have permission to access this page. Please contact an
						admin to configure search settings.
					</v-info>
				</section>
				<section v-if="isAdmin">
					<v-form
						v-model="edits"
						:initial-values="initialValues"
						:fields="fields"
						:validation-errors="validationErrors"
					/>
				</section>
			</template>

			<section v-else-if="globalSearchSettingsField">
				<v-info icon="block" title="Settings Field Error" type="danger" center>
					<p>
						There's an error with the structure of the command palette settings.
					</p>
					<v-button
						style="margin-top: 12px"
						secondary
						@click="updateSearchSettings(defaultSettings)"
					>
						Reset Command Palette Settings
					</v-button>
				</v-info>
			</section>

			<section v-else-if="!globalSearchSettingsField">
				<v-info
					icon="block"
					title="Settings Field Missing"
					type="danger"
					center
				>
					<p>
						The command palette settings field is missing from Directus project
						settings.
					</p>
					<v-button
						kind="primary"
						style="margin-top: 12px"
						@click="createGlobalSearchSettings"
					>
						Create Command Palette Settings
					</v-button>
				</v-info>
			</section>
		</main>

		<!-- Sidebar -->
		<template #sidebar>
			<sidebar-detail icon="info" title="Information" close>
				<div
					v-md="
						`**Global Search** –– \n Search for keywords across many different collections and fields.`
					"
					class="page-description"
				/>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.container {
	padding: var(--content-padding);
	padding-top: 0;
	width: 100%;
	max-width: 1024px;
}
</style>
