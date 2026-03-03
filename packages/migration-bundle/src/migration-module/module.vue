<script lang="ts">
import type { AxiosProgressEvent } from 'axios';
import type { Payload } from '../types/extension';
import { useApi } from '@directus/extensions-sdk';
import { computed, defineComponent, reactive, ref, watch } from 'vue';
import { md } from '../utils/md';
import SupportNavigation from './components/navigation.vue';

type Options = 'schema' | 'content' | 'users' | 'comments' | 'presets' | 'dashboards' | 'extensions' | 'flows' | 'force';

export default defineComponent({
	components: {
		SupportNavigation,
	},
	setup() {
		const baseURL = ref<string>('');
		const token = ref<string>('');
		const lockInterface = ref<boolean>(false);
		const isValidating = ref<boolean>(false);
		const validationMessage = ref<{ status: string; icon: string; message: string } | null>();
		const page_description = 'Migrate the current Directus instance to another location with ease, using this simple module.';
		const response = ref<Record<string, any>>({});
		const dataChunk = ref('');
		const dryRun = ref<boolean>(true);
		const forceSchema = ref<boolean>(false);
		const isLoadingConfig = ref<boolean>(false);
		const isSavingConfig = ref<boolean>(false);
		const presets = ref<any[]>([]);
		const selectedPresetId = ref<number | null>(null);
		const showSaveDialog = ref<boolean>(false);
		const presetName = ref<string>('');
		const presetScope = ref<'user' | 'role' | 'global'>('user');
		const showDeleteConfirmation = ref(false);
		const presetToDelete = ref<number | null>(null);
		const hasChanges = ref<boolean>(false);
		const originalConfig = ref<{ baseURL: string; token: string; options: Options[] }>({
			baseURL: '',
			token: '',
			options: [],
		});

		// Collection-level filtering
		const availableCollections = ref<{ label: string; value: string }[]>([]);
		const selectedCollections = ref<string[]>([]);
		const excludedCollections = ref<string[]>([]);
		const collectionFilterMode = ref<'all' | 'include' | 'exclude'>('all');
		const isLoadingCollections = ref<boolean>(false);

		const migrationOptions = ref<{
			label: string;
			value: string;
		}[]>([
			{
				label: 'Schema',
				value: 'schema',
			},
			{
				label: 'Content',
				value: 'content',
			},
			{
				label: 'Users',
				value: 'users',
			},
			{
				label: 'Comments',
				value: 'comments',
			},
			{
				label: 'Bookmarks',
				value: 'presets',
			},
			{
				label: 'Insights',
				value: 'dashboards',
			},
			{
				label: 'Extensions',
				value: 'extensions',
			},
			{
				label: 'Flows',
				value: 'flows',
			},
		]);

		const migrationOptionsSelections = ref<Options[] | null>(migrationOptions.value.map((o) => o.value as Options));

		const scope = reactive<Record<Options, boolean> & { selectedCollections?: string[]; excludedCollections?: string[]; contentCollections?: string[] }>({
			schema: true,
			users: false,
			content: false,
			comments: false,
			presets: false,
			dashboards: false,
			extensions: false,
			flows: false,
			force: false,
		});

		// Content-specific collection selection (subset of schema-selected collections)
		const contentCollections = ref<string[]>([]);

		// Fix 6.1: Show Force checkbox when partial migration is selected
		const allMigrationOptions = ['schema', 'content', 'users', 'comments', 'presets', 'dashboards', 'extensions', 'flows'];
		const showForceCheckbox = computed(() => {
			// Show if compatibility check suggests force
			const forceInMessage = validationMessage.value?.message?.includes('force') || false;

			// Show if partial migration (not all options selected)
			const partialMigration = !migrationOptionsSelections.value ||
				migrationOptionsSelections.value.length < allMigrationOptions.length;

			return forceInMessage || partialMigration;
		});

		const api = useApi();

		// Fix 3.3: Sync contentCollections with selectedCollections
		// When user selects collections for schema, auto-select them for content too
		watch(selectedCollections, (newValue) => {
			if (newValue && newValue.length > 0) {
				// Auto-sync: content collections = schema selected collections
				contentCollections.value = [...newValue];
			}
		}, { immediate: true });

		// Load available collections from Directus
		const loadCollections = async () => {
			isLoadingCollections.value = true;
			try {
				const response = await api.get('/collections');
				const collections = response.data.data || [];
				availableCollections.value = collections
					.filter((c: any) => !c.collection.startsWith('directus_'))
					.filter((c: any) => c.schema !== null)
					.map((c: any) => ({
						label: c.meta?.translations?.[0]?.translation || c.collection,
						value: c.collection,
					}))
					.sort((a: any, b: any) => a.label.localeCompare(b.label));
			}
			catch (error) {
				console.error('Failed to load collections:', error);
			}
			finally {
				isLoadingCollections.value = false;
			}
		};

		// Load ENV defaults
		const loadEnvDefaults = async () => {
			try {
				const response = await api.get('/migration/defaults');
				const defaults = response.data;

				if (defaults.baseURL) baseURL.value = defaults.baseURL;
				if (defaults.token) token.value = defaults.token;

				if (defaults.options && defaults.options.length > 0) {
					let options = defaults.options.filter((opt: string) =>
						migrationOptions.value.some((o) => o.value === opt),
					) as Options[];
					// Fix 3.2: Ensure 'schema' is always included in options
					if (!options.includes('schema')) {
						options = ['schema', ...options];
					}
					migrationOptionsSelections.value = options;
				}

				// Load collection-level filtering from ENV
				if (defaults.selectedCollections && defaults.selectedCollections.length > 0) {
					selectedCollections.value = defaults.selectedCollections;
					collectionFilterMode.value = 'include';
				}
				else if (defaults.excludedCollections && defaults.excludedCollections.length > 0) {
					excludedCollections.value = defaults.excludedCollections;
					collectionFilterMode.value = 'exclude';
				}
			}
			catch {
				console.warn('No ENV defaults available');
			}
		};

		// Load available presets
		const loadPresets = async () => {
			try {
				const response = await api.get('/migration/presets');
				presets.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load presets:', error);
			}
		};

		// Load specific preset
		const loadPreset = (presetId: number | null) => {
			if (!presetId) {
				// Load ENV defaults instead
				loadEnvDefaults();
				return;
			}

			const preset = presets.value.find((p) => p.id === presetId);

			if (preset?.layout_options) {
				// Parse if it's a string, otherwise use as-is
				const options = typeof preset.layout_options === 'string'
					? JSON.parse(preset.layout_options)
					: preset.layout_options;
				baseURL.value = options.baseURL || '';
				token.value = options.token || '';
				// Fix 3.2: Ensure 'schema' is always included in preset options
				let selectedOptions = options.selectedOptions || [];
				if (!selectedOptions.includes('schema')) {
					selectedOptions = ['schema', ...selectedOptions];
				}
				migrationOptionsSelections.value = selectedOptions;

				// Store original config
				originalConfig.value = {
					baseURL: options.baseURL || '',
					token: options.token || '',
					options: [...(options.selectedOptions || [])],
				};

				hasChanges.value = false;
			}
		};

		// Save as preset
		const savePreset = async () => {
			isSavingConfig.value = true;

			try {
				const response = await api.post('/migration/presets', {
					name: presetName.value || 'Migration Config',
					scope: presetScope.value,
					baseURL: baseURL.value,
					token: token.value,
					options: migrationOptionsSelections.value,
					// Don't send ID - always create new preset
				});

				// Reload presets and select the new one
				await loadPresets();

				if (response.data.data.id) {
					selectedPresetId.value = response.data.data.id;
				}

				showSaveDialog.value = false;
				presetName.value = '';
			}
			catch (error) {
				console.error('Failed to save preset:', error);
			}
			finally {
				isSavingConfig.value = false;
			}
		};

		// Delete preset
		const deletePreset = async (presetId: number) => {
			presetToDelete.value = presetId;
			showDeleteConfirmation.value = true;
		};

		const confirmDelete = async () => {
			if (presetToDelete.value === null) return;

			try {
				await api.delete(`/migration/presets/${presetToDelete.value}`);
				await loadPresets();

				if (selectedPresetId.value === presetToDelete.value) {
					selectedPresetId.value = null;
					loadEnvDefaults();
				}
			}
			catch (error) {
				console.error('Failed to delete preset:', error);
			}
			finally {
				showDeleteConfirmation.value = false;
				presetToDelete.value = null;
			}
		};

		// Initialize on mount
		const initialize = async () => {
			isLoadingConfig.value = true;

			// Load available collections for filtering
			await loadCollections();

			// Load presets first
			await loadPresets();

			// If no presets, load ENV defaults
			if (presets.value.length === 0) {
				await loadEnvDefaults();
			}
			else {
				// Auto-select first user preset if available
				const userPreset = presets.value.find((p) => p.user);

				if (userPreset) {
					selectedPresetId.value = userPreset.id;
					loadPreset(userPreset.id);
				}
				else {
					await loadEnvDefaults();
				}
			}

			isLoadingConfig.value = false;
		};

		// Initialize on mount
		initialize();

		// Update preset
		const updatePreset = async () => {
			if (!selectedPresetId.value || selectedPresetId.value === null) return;

			isSavingConfig.value = true;

			try {
				await api.post('/migration/presets', {
					name: presets.value.find((p) => p.id === selectedPresetId.value)?.bookmark || 'Migration Config',
					scope: 'user', // Always user for existing presets
					baseURL: baseURL.value,
					token: token.value,
					options: migrationOptionsSelections.value,
					id: selectedPresetId.value, // Update existing
				});

				// Reload presets to get fresh data
				await loadPresets();

				// Update the preset in our local array with new values
				const presetIndex = presets.value.findIndex((p) => p.id === selectedPresetId.value);

				if (presetIndex !== -1) {
					presets.value[presetIndex].layout_options = JSON.stringify({
						baseURL: baseURL.value,
						token: token.value,
						selectedOptions: migrationOptionsSelections.value,
					});
				}

				// Update original config after save
				originalConfig.value = {
					baseURL: baseURL.value,
					token: token.value,
					options: [...migrationOptionsSelections.value],
				};

				hasChanges.value = false;
			}
			catch (error) {
				console.error('Failed to update preset:', error);
			}
			finally {
				isSavingConfig.value = false;
			}
		};

		// Watch for changes
		watch([baseURL, token, migrationOptionsSelections], () => {
			hasChanges.value = selectedPresetId.value && selectedPresetId.value !== null
				? baseURL.value !== originalConfig.value.baseURL
				|| token.value !== originalConfig.value.token
				|| JSON.stringify(migrationOptionsSelections.value) !== JSON.stringify(originalConfig.value.options)
				: false;
		}, { deep: true });

		const checkHost = async ({ baseURL, token }: Payload): Promise<void> => {
			isValidating.value = true;

			try {
				const response = await api.post('/migration/check', { baseURL, token, scope });
				validationMessage.value = response.data;
			}
			catch {
				validationMessage.value = { status: 'danger', icon: 'error', message: 'An unknow error occured. Please check logs for more information' };
			}

			isValidating.value = false;
		};

		const extractSchema = async ({ baseURL, token, dryRun }: Payload): Promise<void> => {
			lockInterface.value = true;
			dataChunk.value = '';

			(migrationOptionsSelections.value ?? []).forEach((o) => {
				scope[o] = true;
			});

			scope.force = forceSchema.value;

			// Add collection-level filtering to scope
			if (collectionFilterMode.value === 'include' && selectedCollections.value.length > 0) {
				scope.selectedCollections = selectedCollections.value;
				delete scope.excludedCollections;
			}
			else if (collectionFilterMode.value === 'exclude' && excludedCollections.value.length > 0) {
				scope.excludedCollections = excludedCollections.value;
				delete scope.selectedCollections;
			}
			else {
				delete scope.selectedCollections;
				delete scope.excludedCollections;
			}

			// Add content-specific collection selection
			if (contentCollections.value.length > 0) {
				scope.contentCollections = contentCollections.value;
			}
			else {
				delete scope.contentCollections;
			}

			response.value = await api.post(`/migration/${dryRun ? 'dry-run' : 'run'}`, { baseURL, token, scope }, {
				onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
					let eventObj: XMLHttpRequest | undefined;

					if (progressEvent.event?.currentTarget) {
						eventObj = progressEvent.event?.currentTarget;
					}
					else if (progressEvent.event?.srcElement) {
						eventObj = progressEvent.event?.srcElement;
					}
					else if (progressEvent.event?.target) {
						eventObj = progressEvent.event?.target;
					}

					if (!eventObj)
						return;
					dataChunk.value = eventObj.response;
				},
			});

			lockInterface.value = false;
		};

		return {
			baseURL,
			token,
			scope,
			migrationOptions,
			migrationOptionsSelections,
			page_description,
			lockInterface,
			checkHost,
			extractSchema,
			response,
			dryRun,
			forceSchema,
			dataChunk,
			md,
			isValidating,
			validationMessage,
			isLoadingConfig,
			isSavingConfig,
			// Preset related
			presets,
			selectedPresetId,
			showSaveDialog,
			presetName,
			presetScope,
			loadPreset,
			savePreset,
			deletePreset,
			showDeleteConfirmation,
			confirmDelete,
			hasChanges,
			updatePreset,
			// Collection-level filtering
			availableCollections,
			selectedCollections,
			excludedCollections,
			collectionFilterMode,
			isLoadingCollections,
			contentCollections,
			// Fix 6.1: Force checkbox visibility
			showForceCheckbox,
		};
	},
});
</script>

<template>
	<private-view title="Migrate Directus">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="cloud_upload" outline />
			</v-button>
		</template>
		<template #navigation>
			<SupportNavigation collection="home" />
		</template>
		<div class="migration-container">
			<div class="migration-main">
				<p>To get started, enter the destination URL and admin token below, then click <strong>Check</strong>. This will compare both Directus platform and see if they are compatible. Please make sure the destination instance is on the same version and the same database engine as this instance.</p>

				<!-- Preset Selector -->
				<div v-if="presets.length > 0" class="migration-preset-selector" :class="{ 'has-changes': hasChanges && selectedPresetId }">
					<div class="preset-row">
						<v-select
							v-model="selectedPresetId"
							:items="[
								{ text: 'Load from Environment Defaults', value: null },
								...presets.map(p => ({
									text: p.bookmark,
									value: p.id,
									icon: p.icon,
									color: p.color,
								})),
							]"
							placeholder="Load Configuration"
							@update:model-value="loadPreset"
						>
							<template #prepend>
								<v-icon name="bookmark" />
							</template>
						</v-select>
						<transition name="fade-slide">
							<v-button
								v-if="hasChanges && selectedPresetId"
								v-tooltip="'Update preset'"
								:loading="isSavingConfig"
								secondary
								icon
								@click="updatePreset"
							>
								<v-icon name="save" />
							</v-button>
						</transition>
						<transition name="fade-slide">
							<v-button
								v-if="selectedPresetId"
								v-tooltip="'Delete preset'"
								secondary
								icon
								@click="deletePreset(selectedPresetId)"
							>
								<v-icon name="delete" />
							</v-button>
						</transition>
					</div>
				</div>

				<div class="migration-input-container">
					<div class="migration-input">
						<v-input v-model="baseURL" label="Destination URL" placeholder="https://" :disabled="isValidating || lockInterface || isLoadingConfig" />
						<v-input v-model="token" label="Admin Token" placeholder="**********" :disabled="isValidating || lockInterface || isLoadingConfig" />
						<v-button :disabled="lockInterface || isLoadingConfig" :loading="isValidating" @click="checkHost({ baseURL, token })">
							Check
						</v-button>
						<v-button
							v-tooltip="'Save as Preset'"
							:disabled="lockInterface || isLoadingConfig"
							secondary
							small
							icon
							@click="showSaveDialog = true"
						>
							<v-icon name="bookmark_add" />
						</v-button>
					</div>

					<div v-if="validationMessage" class="migration-validation">
						<v-notice :icon="validationMessage.icon" :type="validationMessage.status">
							{{ validationMessage.message }}
						</v-notice>
					</div>

					<!-- Fix 6.1: Force checkbox - visible for partial migrations -->
					<div v-if="showForceCheckbox && validationMessage" class="migration-force-option">
						<v-checkbox
							v-model="forceSchema"
							label="Force"
							:disabled="lockInterface"
						>
							Force
						</v-checkbox>
						<p v-if="!validationMessage.message.includes('force')" class="force-hint">
							Enable Force mode for partial migrations to apply correctly.
						</p>
					</div>

					<div v-if="forceSchema || (validationMessage && validationMessage.status === 'success')" class="migration-start">
						<div class="migration-options">
							<v-select
								v-model="migrationOptionsSelections"
								:items="migrationOptions"
								:disabled="lockInterface"
								:multiple-preview-threshold="1"
								item-text="label"
								item-value="value"
								item-icon="icon"
								all-items-translation="Migration Options"
								item-count-translation="Migration Options"
								placeholder="Migration Options"
								multiple
							>
								<template #prepend>
									<v-icon name="tune" />
								</template>
							</v-select>
						</div>
						<v-checkbox
							v-model="dryRun"
							label="Dry Run"
							:disabled="lockInterface"
						>
							Dry Run
						</v-checkbox>
						<v-button :disabled="lockInterface" @click="extractSchema({ baseURL, token, dryRun })">
							Start
						</v-button>
					</div>

					<!-- Collection-level filtering (shown when Schema OR Content is selected) -->
					<div v-if="(forceSchema || (validationMessage && validationMessage.status === 'success')) && (migrationOptionsSelections?.includes('schema') || migrationOptionsSelections?.includes('content'))" class="migration-collection-filter">
						<div class="collection-filter-header">
							<v-icon name="filter_list" />
							<span>Schema Collection Filter</span>
							<v-select
								v-model="collectionFilterMode"
								:items="[
									{ text: 'All Collections', value: 'all' },
									{ text: 'Include Only', value: 'include' },
									{ text: 'Exclude', value: 'exclude' },
								]"
								:disabled="lockInterface || isLoadingCollections"
								placeholder="Filter Mode"
							/>
						</div>
						<div v-if="collectionFilterMode === 'include'" class="collection-select">
							<v-select
								v-model="selectedCollections"
								:items="availableCollections"
								:disabled="lockInterface || isLoadingCollections"
								:loading="isLoadingCollections"
								:multiple-preview-threshold="2"
								item-text="label"
								item-value="value"
								placeholder="Select collections for schema migration..."
								multiple
							>
								<template #prepend>
									<v-icon name="add_circle" />
								</template>
							</v-select>
						</div>
						<div v-if="collectionFilterMode === 'exclude'" class="collection-select">
							<v-select
								v-model="excludedCollections"
								:items="availableCollections"
								:disabled="lockInterface || isLoadingCollections"
								:loading="isLoadingCollections"
								:multiple-preview-threshold="2"
								item-text="label"
								item-value="value"
								placeholder="Select collections to exclude..."
								multiple
							>
								<template #prepend>
									<v-icon name="remove_circle" />
								</template>
							</v-select>
						</div>

						<!-- Content collection selection (only when Content is selected AND collections are filtered) -->
						<div v-if="migrationOptionsSelections?.includes('content') && collectionFilterMode === 'include' && selectedCollections.length > 0" class="content-collection-select">
							<div class="collection-filter-header">
								<v-icon name="storage" />
								<span>Content Data Selection</span>
							</div>
							<v-select
								v-model="contentCollections"
								:items="availableCollections.filter(c => selectedCollections.includes(c.value))"
								:disabled="lockInterface || isLoadingCollections"
								:loading="isLoadingCollections"
								:multiple-preview-threshold="2"
								item-text="label"
								item-value="value"
								placeholder="Select which collections should have data migrated..."
								multiple
							>
								<template #prepend>
									<v-icon name="table_rows" />
								</template>
							</v-select>
							<p class="content-hint">Only data from selected collections will be migrated. Leave empty to migrate all schema-selected collections' data.</p>
						</div>
					</div>
				</div>

				<div class="migration-transcript" v-html="md(dataChunk)" />
			</div>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info" title="Information" close>
				<div v-md="page_description" class="page-description" />
			</sidebar-detail>
		</template>

		<!-- Save Preset Dialog -->
		<v-dialog v-model="showSaveDialog" @cancel="showSaveDialog = false">
			<v-card>
				<v-card-title>Save Migration Configuration</v-card-title>
				<v-card-text>
					<div class="field">
						<v-input
							v-model="presetName"
							placeholder="Configuration Name"
							autofocus
						/>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="showSaveDialog = false">
						Cancel
					</v-button>
					<v-button primary :loading="isSavingConfig" @click="savePreset">
						Save
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<!-- Delete Preset Dialog -->
		<v-dialog v-model="showDeleteConfirmation" @cancel="showDeleteConfirmation = false">
			<v-card>
				<v-card-title>Delete Preset</v-card-title>
				<v-card-text> Are you sure you want to delete this preset? This action cannot be undone. </v-card-text>
				<v-card-actions>
					<v-button secondary @click="showDeleteConfirmation = false">
						Cancel
					</v-button>
					<v-button danger @click="confirmDelete">
						Delete
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<style>
	.migration-container {
	padding: 0 var(--content-padding) 0 calc(var(--content-padding) + var(--content-padding));
	padding-bottom: var(--content-padding-bottom);
	display: flex;
	justify-content: space-between;
}

.migration-main {
	max-width: 800px;
	margin-bottom: 3em;
	padding: 0 var(--content-padding);
}

.migration-preset-selector {
	margin-bottom: var(--theme--form--row-gap);
	position: relative;
}

.migration-preset-selector .preset-row {
	display: flex;
	gap: 8px;
	align-items: stretch;
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 4px;
}

.migration-preset-selector .v-select {
	flex: 1;
	background: transparent;
	border: none;
}

.migration-preset-selector .v-select :deep(.v-input) {
	background: transparent;
	border: none;
	box-shadow: none;
}

.migration-preset-selector .v-button {
	border-radius: calc(var(--theme--border-radius) - 4px);
	transition: all 0.2s ease;
}

.migration-input-container {
	padding: var(--theme--form--field--input--padding);
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	box-shadow: var(--theme--form--field--input--box-shadow);
	margin-bottom: 20px;
}

.migration-input {
	display: grid;
	grid-template-columns: 2fr 2fr 1fr auto;
	gap: 20px;
	align-items: end;
}

.migration-input:has(+ .migration-validation) {
	margin-bottom: 20px;
}

.migration-validation {
	display: flex;
	align-items: start;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	margin-bottom: 20px;
}

.migration-validation:has(+ .migration-start) {
	margin-bottom: 20px;
}

.migration-validation .v-checkbox {
	padding-top: 12px;
	padding-right: 20px;
}

.migration-start {
	display: flex;
	justify-content: end;
}

.migration-start .v-input {
	max-width: 300px;
}

.migration-options {
	flex-grow: 1;
}

.migration-start .v-checkbox {
	padding-left: 12px;
	padding-right: var(--theme--form--field--input--padding);
	margin-right: 20px;
}

@media (max-width: 700px) {
	.migration-input {
		grid-template-columns: 1fr;
	}

	.migration-start {
		flex-wrap: wrap;
	}

	.migration-start .v-input {
		max-width: auto;
		margin-bottom: 20px;
	}
}

.migration-container h2,
.migration-container h3 {
	font-weight: bold;
	margin-bottom: 0.5em;
}

.migration-container h2 {
	font-size: 1.4em;
}

.migration-transcript h2 {
	margin-top: 24px;
}

.migration-container h3 {
	font-size: 1.2em;
}

.migration-container h3.skip {
	color: var(--theme--form--field--input--foreground-subdued);
}

.migration-container p {
	margin-bottom: 1em;
}

.migration-container p a {
	font-weight: bold;
	color: var(--theme--primary);
}

.migration-container ul {
	margin-bottom: 1em;
}

.migration-container li p {
	margin-bottom: 0;
}

.migration-sidecar {
	width: calc(100% - 840px);
}

h3.done .icon,
h3.skipped .icon,
h3.error .icon {
	position: relative;
	display: inline-block;
	width: 24px;
	min-width: 24px;
	height: 20px;
	font-size: 0;
	vertical-align: middle;
}

h3.done .icon {
	color: var(--theme--success);
}

h3.error .icon {
	color: var(--theme--danger);
}

h3.skipped .icon {
	color: var(--theme--form--field--input--foreground-subdued);
}

h3.done .icon i,
h3.error .icon i,
h3.skipped .icon i {
	display: block;
	font-family: 'Material Symbols';
	font-weight: normal;
	font-size: 18px;
	font-style: normal;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-rendering: optimizeLegibility;
	font-feature-settings: 'liga';
	font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

h3.done .icon i::after {
	content: 'check';
}

h3.error .icon i::after {
	content: 'error';
}

h3.skipped .icon i::after {
	content: 'fast_forward';
}

.migration-transcript .progress-circular {
	position: relative;
	display: inline-block;
	width: 16px;
	height: 16px;
	margin-right: 8px;
}

.migration-transcript .progress-circular .circle.indeterminate {
	animation: progress-circular-rotate var(--v-progress-circular-speed, 2s) infinite linear;
}

.migration-transcript .progress-circular .circle {
	position: absolute;
	top: 0;
	left: 0;
	width: 16px;
	height: 16px;
}

.migration-transcript .progress-circular .circle-background {
	fill: transparent;
	stroke: var(--v-progress-circular-background-color, var(--theme--form--field--input--border-color));
	stroke-width: var(--v-progress-circular-line-size, 3px);
}

.migration-transcript .progress-circular .circle.indeterminate .circle-path[data-v-0b5afddc] {
	animation: progress-circular-stroke var(--v-progress-circular-speed, 2s) infinite linear;
}

.migration-transcript .progress-circular .circle-path {
	transition: stroke-dasharray var(--v-progress-circular-transition, 400ms) ease-in-out;
	fill: transparent;
	stroke: var(--v-progress-circular-color, var(--theme--foreground));
	stroke-width: 3px;
}

@keyframes progress-circular-rotate {
	0% {
		transform: rotate(0deg);
	}
	50% {
		transform: rotate(360deg);
	}
	100% {
		transform: rotate(1080deg);
	}
}

@keyframes progress-circular-stroke {
	0% {
		stroke-dasharray: 0, 78.5px;
	}
	50% {
		stroke-dasharray: 78.5px, 78.5px;
	}
	100% {
		stroke-dasharray: 0, 78.5px;
	}
}

.migration-container .pending:has(+ .done) {
	display: none;
}

.migration-container .pending:has(+ .error) .progress-circular {
	display: none;
}

/* Fade slide animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
	transition: all 0.2s ease;
}

.fade-slide-enter-from {
	opacity: 0;
	transform: translateX(-10px);
}

.fade-slide-leave-to {
	opacity: 0;
	transform: translateX(10px);
}

/* Optional: Add a subtle indicator when preset has changes */
.migration-preset-selector.has-changes .preset-row {
	border-color: var(--theme--primary);
	box-shadow: 0 0 0 1px var(--theme--primary-background);
}

/* Collection-level filtering styles */
.migration-collection-filter {
	margin-top: 20px;
	padding: var(--theme--form--field--input--padding);
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
}

.collection-filter-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.collection-filter-header span {
	flex-grow: 1;
	font-weight: 600;
}

.collection-filter-header .v-select {
	max-width: 180px;
}

.collection-select {
	margin-top: 8px;
}

.collection-select .v-select {
	width: 100%;
}

.content-collection-select {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px solid var(--theme--border-color);
}

.content-collection-select .v-select {
	width: 100%;
	margin-top: 8px;
}

.content-hint {
	margin-top: 8px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}
</style>
