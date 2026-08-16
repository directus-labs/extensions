<script setup lang="ts">
import type { ValidationError } from '@directus/types';
import type { Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { SearchConfigType } from './types';
import { useStores } from '@directus/extensions-sdk';
import { useMagicKeys } from '@vueuse/core';
import { clone, mergeWith } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ZodError } from 'zod';
import SearchNavigation from './components/navigation.vue';
import { useIsAdmin } from './composables/use-is-admin';
import { useUnexpectedError } from './composables/use-unexpected-error';
import { fields } from './settings-fields';
import { defaultSettings, ModuleSettings } from './types';
import { zodErrorToValidationErrors } from './utils/errors';
import { parsePersistedSettings } from './utils/parse-persisted-settings';

const i18n = useI18n();
const { t } = i18n;
const router = useRouter();
const stores = useStores();
const { useSettingsStore, useFieldsStore } = stores;
const fieldsStore = useFieldsStore();
const settingsStore = useSettingsStore();
const isAdmin = useIsAdmin();
const unexpectedError = useUnexpectedError({ stores, i18n });
const globalSearchSettings = computed(() => settingsStore.settings.command_palette_settings);
const parsedSettings = computed(() => parsePersistedSettings(globalSearchSettings.value));
const globalSearchSettingsField = computed(() =>
	fieldsStore.getField('directus_settings', 'command_palette_settings'),
);
const initialValues = ref(clone(settingsStore.settings.command_palette_settings));
const edits: Ref<Partial<SearchConfigType> | null> = ref(null);
const hasEdits = computed(() => edits.value !== null && Object.keys(edits.value).length > 0);
const saving = ref(false);
const validationErrors = ref<ValidationError[]>([]);

async function persistSettings(value: SearchConfigType) {
	await settingsStore.updateSettings({ command_palette_settings: value });
	await settingsStore.hydrate();
	initialValues.value = clone(settingsStore.settings.command_palette_settings);
}

async function updateSearchSettings(value: Partial<SearchConfigType> | null | undefined) {
	if (!value || saving.value) return;

	validationErrors.value = [];
	saving.value = true;

	try {
		// Collection settings are complete form values, so replacing arrays preserves deletions.
		const merged = mergeWith({}, initialValues.value, value, (_current, update) =>
			Array.isArray(update) ? update : undefined);
		const result = ModuleSettings.parse(merged);
		await persistSettings(result);
		edits.value = null;
	}
	catch (error) {
		if (error instanceof ZodError) {
			validationErrors.value = zodErrorToValidationErrors(error, 'command_palette_settings');
		}
		else {
			unexpectedError(error);
		}
	}
	finally {
		saving.value = false;
	}
}

async function createGlobalSearchSettings() {
	if (globalSearchSettingsField.value || !isAdmin.value || saving.value) return;

	saving.value = true;

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

		await persistSettings(defaultSettings);
	}
	catch (error) {
		unexpectedError(error);
	}
	finally {
		saving.value = false;
	}
}

const { control, meta, s } = useMagicKeys();

watch([meta, control, s], ([metaValue, controlValue, sValue]) => {
	if ((metaValue || controlValue) && sValue && hasEdits.value && !saving.value) {
		void updateSearchSettings(edits.value);
	}
});

const confirmLeave = ref(false);
const leaveTo = ref<RouteLocationRaw | null>(null);

onBeforeRouteLeave((to) => {
	if (!hasEdits.value) return true;
	leaveTo.value = to;
	confirmLeave.value = true;
	return false;
});

function discardAndLeave() {
	if (!leaveTo.value) return;

	const target = leaveTo.value;
	edits.value = null;
	confirmLeave.value = false;
	leaveTo.value = null;
	void router.push(target);
}
</script>

<template>
	<private-view title="Settings">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="search" />
			</v-button>
		</template>

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

		<template v-if="isAdmin" #actions>
			<v-button
				v-tooltip.bottom="hasEdits ? t('save') : t('not_allowed')"
				rounded
				icon
				:loading="saving"
				:disabled="!hasEdits || saving"
				@click="updateSearchSettings(edits)"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<main class="container">
			<template v-if="parsedSettings">
				<section v-if="!isAdmin">
					<v-info icon="block" title="Unauthorized Access" type="danger" center>
						You do not have permission to access this page. Please contact an
						admin to configure search settings.
					</v-info>
				</section>
				<section v-else>
					<v-form
						v-model="edits"
						:initial-values="initialValues"
						:fields="fields"
						:validation-errors="validationErrors"
						:disabled="saving"
					/>
				</section>
			</template>

			<section v-else-if="globalSearchSettingsField">
				<v-info icon="block" title="Settings Field Error" type="danger" center>
					<p>There's an error with the structure of the command palette settings.</p>
					<v-button
						v-if="isAdmin"
						style="margin-top: 12px"
						secondary
						:disabled="saving"
						@click="updateSearchSettings(defaultSettings)"
					>
						Reset Command Palette Settings
					</v-button>
					<p v-else>
						Please contact an admin to reset the command palette settings.
					</p>
				</v-info>
			</section>

			<section v-else>
				<v-info icon="block" title="Settings Field Missing" type="danger" center>
					<p>The command palette settings field is missing from Directus project settings.</p>
					<v-button
						v-if="isAdmin"
						kind="primary"
						style="margin-top: 12px"
						:loading="saving"
						:disabled="saving"
						@click="createGlobalSearchSettings"
					>
						Create Command Palette Settings
					</v-button>
					<p v-else>
						Please contact an admin to create the command palette settings.
					</p>
				</v-info>
			</section>
		</main>

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

		<v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
				<v-card-actions>
					<v-button secondary @click="discardAndLeave">
						{{ t('discard_changes') }}
					</v-button>
					<v-button @click="confirmLeave = false">
						{{ t('keep_editing') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
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
