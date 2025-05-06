<script setup lang="ts">
import type { ValidationError } from '@directus/types';
import type { Ref } from 'vue';
import { useStores } from '@directus/extensions-sdk';
import { clone, merge } from 'lodash-es';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ZodError } from 'zod';
import { ModuleSettings, type CollaborativeEditingConfigType, defaultSettings } from './types';
import { zodErrorToValidationErrors } from './utils/errors';
import { useIsAdmin } from './composables/use-is-admin';
import { fields } from './settings-fields';

const { t } = useI18n();
const { useSettingsStore, useFieldsStore } = useStores();

const fieldsStore = useFieldsStore();
const settingsStore = useSettingsStore();

const isAdmin = useIsAdmin();

const collaborativeEditingSettings = computed(() => settingsStore.settings.collaborative_editing_settings);

const collaborativeEditingSettingsField = fieldsStore.getField('directus_settings', 'collaborative_editing_settings');

console.log('collaborativeEditingSettings', collaborativeEditingSettings);

const initialValues = ref(clone(settingsStore.settings.collaborative_editing_settings));

const edits: Ref<Partial<CollaborativeEditingConfigType> | null> = ref(null);

const hasEdits = computed(() => {
	return edits.value !== null && Object.keys(edits.value).length > 0;
});

const saving = ref(false);
const validationErrors = ref<ValidationError[]>([]);

async function updateCollaborativeEditingSettings(value: CollaborativeEditingConfigType) {
	if (!value) return;
	validationErrors.value = [];
	saving.value = true;

	try {
		const result = ModuleSettings.parse(merge({}, initialValues.value, value));

		await settingsStore.updateSettings({
			collaborative_editing_settings: result,
		});

		await settingsStore.hydrate();
		edits.value = null;
		saving.value = false;

		initialValues.value = clone(settingsStore.settings.collaborative_editing_settings);
	} catch (error) {
		if (error instanceof ZodError) {
			validationErrors.value = zodErrorToValidationErrors(error, 'collaborative_editing_settings');
		}

		saving.value = false;
	}
}

async function createCollaborativeEditingSettings() {
	if (collaborativeEditingSettingsField) return;

	try {
		await fieldsStore.createField('directus_settings', {
			type: 'json',
			meta: {
				interface: 'input-code',
				special: ['cast-json'],
				display: 'raw',
			},
			field: 'collaborative_editing_settings',
			schema: {
				default_value: {},
			},
		});

		await updateCollaborativeEditingSettings(defaultSettings);
		await settingsStore.hydrate();

		initialValues.value = clone(settingsStore.settings.collaborative_editing_settings);
	} catch (error) {
		console.error(error);
		// @TODO: Handle error
	}
}
</script>

<template>
	<private-view title="Collaborative Editing Settings">
		<!-- Header Icon -->
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="connect_without_contact" />
			</v-button>
		</template>

		<!-- Actions -->
		<template #actions>
			<v-button
				v-tooltip.bottom="hasEdits ? t('save') : t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!hasEdits"
				@click="edits && updateCollaborativeEditingSettings(merge({}, initialValues.value, edits))"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<!-- Main Content -->
		<main class="container">
			<template v-if="collaborativeEditingSettings">
				<section v-if="!isAdmin">
					<v-info icon="block" title="Unauthorized Access" type="danger" center>
						You do not have permission to access this page. Please contact an admin to configure collaborative editing
						settings.
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

			<section v-else-if="collaborativeEditingSettingsField">
				<v-info icon="block" title="Settings Field Error" type="danger" center>
					<p>There's an error with the structure of the collaborative editing settings.</p>
					<v-button style="margin-top: 12px" secondary @click="updateCollaborativeEditingSettings(defaultSettings)">
						Reset Collaborative Editing Settings
					</v-button>
				</v-info>
			</section>

			<section v-else-if="!collaborativeEditingSettingsField">
				<v-info icon="block" title="Settings Field Missing" type="danger" center>
					<p>The collaborative editing settings field is missing from Directus project settings.</p>
					<v-button kind="primary" style="margin-top: 12px" @click="createCollaborativeEditingSettings">
						Create Collaborative Editing Settings
					</v-button>
				</v-info>
			</section>
		</main>

		<!-- Sidebar -->
		<template #sidebar>
			<sidebar-detail icon="info" title="Information" close>
				<div
					v-md="`**Collaborative Editing** -- \n Enable collaborative editing for Directus.`"
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
