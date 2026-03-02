<script lang="ts">
import type { AxiosProgressEvent } from 'axios';
import type { Payload, UsersGranularOptions } from '../types/extension';
import { useApi } from '@directus/extensions-sdk';
import { computed, defineComponent, reactive, ref, watch } from 'vue';
import { md } from '../utils/md';
import SupportNavigation from './components/navigation.vue';

type Options = 'schema' | 'content' | 'files' | 'users' | 'comments' | 'presets' | 'dashboards' | 'extensions' | 'flows' | 'settings' | 'translations' | 'force';

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
				label: 'Files',
				value: 'files',
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
			{
				label: 'Settings',
				value: 'settings',
			},
			{
				label: 'Translations',
				value: 'translations',
			},
		]);

		const migrationOptionsSelections = ref<Options[] | null>(migrationOptions.value.map((o) => o.value as Options));

		const scope = reactive<Record<Options, boolean> & { selectedCollections?: string[]; excludedCollections?: string[]; contentCollections?: string[]; folders?: boolean }>({
			schema: true,
			users: false,
			content: false,
			files: true,  // Fix: Files checked by default
			folders: true,
			comments: false,
			presets: false,
			dashboards: false,
			extensions: false,
			flows: false,
			settings: true,      // Default true for backward compatibility
			translations: true,  // Default true for backward compatibility
			force: false,
		});

		// Content-specific collection selection (subset of schema-selected collections)
		const contentCollections = ref<string[]>([]);

		// Fix 6.1: Show Force checkbox when partial migration is selected
		const allMigrationOptions = ['schema', 'content', 'files', 'users', 'comments', 'presets', 'dashboards', 'extensions', 'flows', 'settings', 'translations'];
		const showForceCheckbox = computed(() => {
			// Show if compatibility check suggests force
			const forceInMessage = validationMessage.value?.message?.includes('force') || false;

			// Show if partial migration (not all options selected)
			const partialMigration = !migrationOptionsSelections.value ||
				migrationOptionsSelections.value.length < allMigrationOptions.length;

			return forceInMessage || partialMigration;
		});

		// Users granular options
		const usersGranular = reactive<UsersGranularOptions>({
			roles: true,
			policies: true,
			permissions: true,
			userAccounts: true,
			access: true,
		});

		// Watch for users granular dependencies
		watch(() => usersGranular.roles, (val) => {
			if (!val) {
				usersGranular.policies = false;
				usersGranular.userAccounts = false;
			}
		});

		watch(() => usersGranular.policies, (val) => {
			if (!val) {
				usersGranular.permissions = false;
				usersGranular.access = false;
			}
		});

		watch(() => usersGranular.userAccounts, (val) => {
			if (!val) {
				usersGranular.access = false;
			}
		});

		// Selected flows and extensions for granular selection
		const selectedFlows = ref<string[]>([]);
		const selectedExtensions = ref<string[]>([]);
		// Issue #017: Full data storage for flows (unfiltered)
		const allFlows = ref<Array<{ id: string; name: string; collection: string | null }>>([]);
		const availableFlows = ref<Array<{ id: string; name: string; collection: string | null }>>([]);
		const availableExtensions = ref<Array<{ name: string; bundle: string | null; source: 'registry' | 'local' }>>([]);

		// Phase 6: Users tab - specific item selection
		const availableRoles = ref<Array<{ id: string; name: string }>>([]);
		const availablePolicies = ref<Array<{ id: string; name: string }>>([]);
		const availablePermissions = ref<Array<{ id: number; policy: string; collection: string; action: string }>>([]);
		const availableUsers = ref<Array<{ id: string; email: string; first_name: string; last_name: string; role: string }>>([]);
		const availableAccessRules = ref<Array<{ id: number; role: string | null; user: string | null; policy: string }>>([]);

		const selectedRoles = ref<string[]>([]);
		const selectedPolicies = ref<string[]>([]);
		const selectedPermissions = ref<number[]>([]);
		const selectedUserAccounts = ref<string[]>([]);
		const selectedAccessRules = ref<number[]>([]);

		// Issue #013: Settings filtering
		const settingsFilterMode = ref<'all' | 'selected'>('all');
		const availableSettingsFields = ref<Array<{ text: string; value: string }>>([]);
		const selectedSettingsFields = ref<string[]>([]);
		const isLoadingSettings = ref<boolean>(false);

		// Issue #013: Translations filtering
		const translationsFilterMode = ref<'all' | 'filtered'>('all');
		const availableLanguages = ref<Array<{ text: string; value: string }>>([]);
		const selectedLanguages = ref<string[]>([]);
		const translationKeyPattern = ref<string>('');
		const isLoadingLanguages = ref<boolean>(false);

		// Issue #014: Bookmarks (Presets) filtering
		const bookmarksFilterMode = ref<'all' | 'selected'>('all');
		// Issue #017: Full data storage for bookmarks (unfiltered)
		const allBookmarks = ref<Array<{ text: string; value: string; collection: string | null }>>([]);
		const availableBookmarks = ref<Array<{ text: string; value: string; collection: string | null }>>([]);
		const selectedBookmarks = ref<string[]>([]);
		const isLoadingBookmarks = ref<boolean>(false);

		// Issue #014: Insights (Dashboards) filtering
		const insightsFilterMode = ref<'all' | 'selected'>('all');
		const availableInsights = ref<Array<{ text: string; value: string; panelCount: number }>>([]);
		const selectedInsights = ref<string[]>([]);
		const isLoadingInsights = ref<boolean>(false);

		// Issue #009: Files filtering
		const filesFilterMode = ref<'all' | 'selected'>('all');
		const availableFolders = ref<Array<{ text: string; value: string }>>([]);
		const selectedFolders = ref<string[]>([]);
		const isLoadingFolders = ref<boolean>(false);

		// Issue #009: Comments integration into Content tab
		const includeCommentsForContent = ref<boolean>(true);

		// Tab-based UI - active tab for granular options
		const activeTab = ref<string[]>(['schema']);

		// Auto-switch to first enabled tab when options change
		watch(migrationOptionsSelections, (selections) => {
			if (!selections || selections.length === 0) {
				activeTab.value = [];
				return;
			}
			// Check if current tab is still valid
			const currentTab = activeTab.value[0];
			const tabOptions = ['schema', 'content', 'files', 'users', 'presets', 'dashboards', 'flows', 'extensions', 'settings', 'translations'];
			if (currentTab && selections.includes(currentTab as Options)) {
				return; // Current tab is still valid
			}
			// Switch to first available tab
			for (const tab of tabOptions) {
				if (selections.includes(tab as Options)) {
					activeTab.value = [tab];
					return;
				}
			}
			activeTab.value = [];
		}, { immediate: true });

		const api = useApi();

		// Fix 3.3: Sync contentCollections with selectedCollections
		// When user selects collections for schema, auto-select them for content too
		watch(selectedCollections, (newValue) => {
			if (newValue && newValue.length > 0) {
				// Auto-sync: content collections = schema selected collections
				contentCollections.value = [...newValue];
			}
		}, { immediate: true });

		// Issue #017: Watch collection selection changes and update available bookmarks/flows
		watch(
			[selectedCollections, excludedCollections, collectionFilterMode],
			() => {
				filterAvailableBookmarks();
				filterAvailableFlows();

				// Clear selections that are no longer available
				const availableBookmarkIds = new Set(availableBookmarks.value.map(b => b.value));
				selectedBookmarks.value = selectedBookmarks.value.filter(id =>
					availableBookmarkIds.has(id),
				);

				const availableFlowIds = new Set(availableFlows.value.map(f => f.id));
				selectedFlows.value = selectedFlows.value.filter(id =>
					availableFlowIds.has(id),
				);
			},
			{ deep: true },
		);

		// Issue #019 Fix: Defensive watchers to convert null to empty arrays
		// Directus v-select returns null instead of [] when all items are deselected
		watch(selectedExtensions, (val) => {
			if (val === null) selectedExtensions.value = [];
		});
		watch(selectedFlows, (val) => {
			if (val === null) selectedFlows.value = [];
		});
		watch(selectedBookmarks, (val) => {
			if (val === null) selectedBookmarks.value = [];
		});
		watch(selectedInsights, (val) => {
			if (val === null) selectedInsights.value = [];
		});
		watch(selectedRoles, (val) => {
			if (val === null) selectedRoles.value = [];
		});
		watch(selectedPolicies, (val) => {
			if (val === null) selectedPolicies.value = [];
		});
		watch(selectedPermissions, (val) => {
			if (val === null) selectedPermissions.value = [];
		});
		watch(selectedUserAccounts, (val) => {
			if (val === null) selectedUserAccounts.value = [];
		});
		watch(selectedAccessRules, (val) => {
			if (val === null) selectedAccessRules.value = [];
		});
		watch(selectedCollections, (val) => {
			if (val === null) selectedCollections.value = [];
		});
		watch(excludedCollections, (val) => {
			if (val === null) excludedCollections.value = [];
		});
		watch(contentCollections, (val) => {
			if (val === null) contentCollections.value = [];
		});
		watch(selectedFolders, (val) => {
			if (val === null) selectedFolders.value = [];
		});
		watch(selectedSettingsFields, (val) => {
			if (val === null) selectedSettingsFields.value = [];
		});
		watch(selectedLanguages, (val) => {
			if (val === null) selectedLanguages.value = [];
		});
		watch(migrationOptionsSelections, (val) => {
			if (val === null) migrationOptionsSelections.value = [];
		});

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

		// Issue #017: Helper function to check if collection should be included in GUI
		const shouldIncludeCollectionInGUI = (collection: string | null): boolean => {
			// If no filtering active, include all (including null)
			if (collectionFilterMode.value === 'all') return true;

			// Include mode: null collection does NOT match any selected collection
			if (collectionFilterMode.value === 'include') {
				if (!collection) return false; // null != selected collections
				if (!selectedCollections.value || selectedCollections.value.length === 0) return true;
				return selectedCollections.value.includes(collection);
			}

			// Exclude mode: null collection is not in excluded list, so include it
			if (collectionFilterMode.value === 'exclude') {
				if (!collection) return true; // null is not excluded
				return !excludedCollections.value.includes(collection);
			}

			return true;
		};

		// Issue #017: Filter bookmarks based on collection selection
		const filterAvailableBookmarks = () => {
			availableBookmarks.value = allBookmarks.value.filter(bookmark =>
				shouldIncludeCollectionInGUI(bookmark.collection),
			);
		};

		// Issue #017: Filter flows based on collection selection
		const filterAvailableFlows = () => {
			availableFlows.value = allFlows.value.filter(flow =>
				shouldIncludeCollectionInGUI(flow.collection),
			);
		};

		// Phase 6: Load functions for Users tab items
		const loadRoles = async () => {
			try {
				const response = await api.get('/roles', { params: { fields: ['id', 'name'], limit: -1 } });
				availableRoles.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load roles:', error);
			}
		};

		const loadPolicies = async () => {
			try {
				const response = await api.get('/policies', { params: { fields: ['id', 'name'], limit: -1 } });
				availablePolicies.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load policies:', error);
			}
		};

		const loadPermissions = async () => {
			try {
				const response = await api.get('/permissions', { params: { fields: ['id', 'policy', 'collection', 'action'], limit: -1 } });
				availablePermissions.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load permissions:', error);
			}
		};

		const loadUserAccounts = async () => {
			try {
				const response = await api.get('/users', { params: { fields: ['id', 'email', 'first_name', 'last_name', 'role'], limit: -1 } });
				availableUsers.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load users:', error);
			}
		};

		const loadAccessRules = async () => {
			try {
				const response = await api.get('/access', { params: { fields: ['id', 'role', 'user', 'policy'], limit: -1 } });
				availableAccessRules.value = response.data.data || [];
			}
			catch (error) {
				console.error('Failed to load access rules:', error);
			}
		};

		const loadUsersTabData = async () => {
			await Promise.all([
				loadRoles(),
				loadPolicies(),
				loadPermissions(),
				loadUserAccounts(),
				loadAccessRules(),
			]);
		};

		// Issue #013: Load available settings fields
		const loadSettingsFields = async () => {
			isLoadingSettings.value = true;
			try {
				const response = await api.get('/settings');
				const settings = response.data.data || {};
				// Extract field names from settings object
				const fields = Object.keys(settings)
					.filter(key => !key.startsWith('id')) // Exclude id field
					.map(key => ({
						text: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
						value: key,
					}))
					.sort((a, b) => a.text.localeCompare(b.text));
				availableSettingsFields.value = fields;
			}
			catch (error) {
				console.error('Failed to load settings fields:', error);
			}
			finally {
				isLoadingSettings.value = false;
			}
		};

		// Issue #013: Load available languages for translations
		const loadLanguages = async () => {
			isLoadingLanguages.value = true;
			try {
				const response = await api.get('/translations', {
					params: {
						fields: ['language'],
						groupBy: ['language'],
						limit: -1,
					},
				});
				const translations = response.data.data || [];
				const languages = [...new Set(translations.map((t: any) => t.language))]
					.filter(Boolean)
					.map(lang => ({
						text: lang as string,
						value: lang as string,
					}))
					.sort((a, b) => a.text.localeCompare(b.text));
				availableLanguages.value = languages;
			}
			catch (error) {
				console.error('Failed to load languages:', error);
				// Fallback: try to get unique languages from all translations
				try {
					const fallbackResponse = await api.get('/translations', { params: { fields: ['language'], limit: -1 } });
					const allTranslations = fallbackResponse.data.data || [];
					const uniqueLanguages = [...new Set(allTranslations.map((t: any) => t.language))]
						.filter(Boolean)
						.map(lang => ({
							text: lang as string,
							value: lang as string,
						}))
						.sort((a, b) => a.text.localeCompare(b.text));
					availableLanguages.value = uniqueLanguages;
				}
				catch (fallbackError) {
					console.error('Failed to load languages (fallback):', fallbackError);
				}
			}
			finally {
				isLoadingLanguages.value = false;
			}
		};

		// Issue #014: Load available bookmarks (presets)
		// Issue #017: Store full data with collection field for GUI filtering
		const loadBookmarks = async () => {
			isLoadingBookmarks.value = true;
			try {
				const response = await api.get('/presets', {
					params: {
						fields: ['id', 'bookmark', 'collection', 'icon', 'color'],
						limit: -1,
					},
				});
				const presetsData = response.data.data || [];
				// Store full data with collection field
				allBookmarks.value = presetsData
					.filter((p: any) => p.bookmark) // Only include named bookmarks
					.map((p: any) => ({
						text: p.bookmark || `Preset ${p.id}`,
						value: String(p.id),
						collection: p.collection || null,
					}))
					.sort((a: any, b: any) => a.text.localeCompare(b.text));
				// Apply initial filter
				filterAvailableBookmarks();
			}
			catch (error) {
				console.error('Failed to load bookmarks:', error);
			}
			finally {
				isLoadingBookmarks.value = false;
			}
		};

		// Issue #014: Load available insights (dashboards)
		const loadInsights = async () => {
			isLoadingInsights.value = true;
			try {
				// Fetch dashboards
				const dashboardsResponse = await api.get('/dashboards', {
					params: {
						fields: ['id', 'name', 'icon', 'color'],
						limit: -1,
					},
				});
				const dashboardsData = dashboardsResponse.data.data || [];

				// Fetch panels to count per dashboard
				const panelsResponse = await api.get('/panels', {
					params: {
						fields: ['id', 'dashboard'],
						limit: -1,
					},
				});
				const panelsData = panelsResponse.data.data || [];

				// Count panels per dashboard
				const panelCounts: Record<string, number> = {};
				panelsData.forEach((panel: any) => {
					const dashboardId = panel.dashboard;
					panelCounts[dashboardId] = (panelCounts[dashboardId] || 0) + 1;
				});

				availableInsights.value = dashboardsData
					.map((d: any) => ({
						text: d.name || `Dashboard ${d.id}`,
						value: String(d.id),
						panelCount: panelCounts[d.id] || 0,
					}))
					.sort((a: any, b: any) => a.text.localeCompare(b.text));
			}
			catch (error) {
				console.error('Failed to load insights:', error);
			}
			finally {
				isLoadingInsights.value = false;
			}
		};

		// Issue #009: Load available folders
		const loadFolders = async () => {
			isLoadingFolders.value = true;
			try {
				const response = await api.get('/folders', {
					params: {
						fields: ['id', 'name', 'parent'],
						limit: -1,
					},
				});
				const foldersData = response.data.data || [];

				// Build folder tree labels with parent path
				const folderMap = new Map<string, any>();
				foldersData.forEach((f: any) => folderMap.set(f.id, f));

				const buildLabel = (folder: any): string => {
					if (folder.parent && folderMap.has(folder.parent)) {
						return `${buildLabel(folderMap.get(folder.parent))} / ${folder.name}`;
					}
					return folder.name;
				};

				availableFolders.value = foldersData
					.map((f: any) => ({
						text: buildLabel(f),
						value: String(f.id),
					}))
					.sort((a: any, b: any) => a.text.localeCompare(b.text));
			}
			catch (error) {
				console.error('Failed to load folders:', error);
			}
			finally {
				isLoadingFolders.value = false;
			}
		};

		// Load Users tab data when tab becomes active
		watch(activeTab, (tab) => {
			if (tab[0] === 'users' && availableRoles.value.length === 0) {
				loadUsersTabData();
			}
			// Issue #013: Load settings fields when Settings tab becomes active
			if (tab[0] === 'settings' && availableSettingsFields.value.length === 0) {
				loadSettingsFields();
			}
			// Issue #013: Load languages when Translations tab becomes active
			if (tab[0] === 'translations' && availableLanguages.value.length === 0) {
				loadLanguages();
			}
			// Issue #009: Load folders when Files tab becomes active
			if (tab[0] === 'files' && availableFolders.value.length === 0) {
				loadFolders();
			}
			// Issue #014: Load bookmarks when Bookmarks tab becomes active
			if (tab[0] === 'presets' && availableBookmarks.value.length === 0) {
				loadBookmarks();
			}
			// Issue #014: Load insights when Insights tab becomes active
			if (tab[0] === 'dashboards' && availableInsights.value.length === 0) {
				loadInsights();
			}
		});

		// Phase 6: Auto-select dependencies when items are selected
		// When user account is selected, auto-select their role
		watch(selectedUserAccounts, (userIds) => {
			if (!userIds || userIds.length === 0) return;
			const users = availableUsers.value.filter(u => userIds.includes(u.id));
			const roleIds = [...new Set(users.map(u => u.role).filter(Boolean))] as string[];
			roleIds.forEach(roleId => {
				if (!selectedRoles.value.includes(roleId)) {
					selectedRoles.value.push(roleId);
				}
			});
		});

		// When access rule is selected, auto-select role and policy
		watch(selectedAccessRules, (accessIds) => {
			if (!accessIds || accessIds.length === 0) return;
			const accessItems = availableAccessRules.value.filter(a => accessIds.includes(a.id));
			accessItems.forEach(access => {
				if (access.role && !selectedRoles.value.includes(access.role)) {
					selectedRoles.value.push(access.role);
				}
				if (access.policy && !selectedPolicies.value.includes(access.policy)) {
					selectedPolicies.value.push(access.policy);
				}
			});
		});

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
					// Fix: Ensure 'files' is always included in options (backward compatibility)
					if (!options.includes('files')) {
						options = [...options, 'files'];
					}
					// Fix: Ensure 'settings' is always included in options
					if (!options.includes('settings')) {
						options = [...options, 'settings'];
					}
					// Fix: Ensure 'translations' is always included in options
					if (!options.includes('translations')) {
						options = [...options, 'translations'];
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
				// Fix: Ensure 'files' is always included in preset options (backward compatibility)
				if (!selectedOptions.includes('files')) {
					selectedOptions = [...selectedOptions, 'files'];
				}
				// Fix: Ensure 'settings' is always included in preset options
				if (!selectedOptions.includes('settings')) {
					selectedOptions = [...selectedOptions, 'settings'];
				}
				// Fix: Ensure 'translations' is always included in preset options
				if (!selectedOptions.includes('translations')) {
					selectedOptions = [...selectedOptions, 'translations'];
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

		// Fetch available flows and extensions
		// Issue #017: Include flow options for collection filtering in GUI
		const fetchAvailableData = async () => {
			try {
				const [flowsResponse, extensionsResponse] = await Promise.all([
					api.get('/flows', { params: { fields: ['id', 'name', 'options'], limit: -1 } }),
					api.get('/extensions'),
				]);
				// Store full data with collection from options
				allFlows.value = (flowsResponse.data.data || []).map((f: any) => ({
					id: f.id,
					name: f.name,
					collection: f.options?.collection || null,
				}));
				// Apply initial filter
				filterAvailableFlows();
				availableExtensions.value = (extensionsResponse.data.data || []).map((ext: any) => ({
					name: ext.schema?.name || ext.id,
					bundle: ext.bundle,
					source: ext.meta?.source || 'local',
				}));
			}
			catch (error) {
				console.warn('Failed to fetch flows/extensions:', error);
			}
		};

		fetchAvailableData();

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

			// Build extended scope with collection filtering and granular options
			const extendedScope: Record<string, any> = { ...scope };

			// Add collection-level filtering to scope
			if (collectionFilterMode.value === 'include' && selectedCollections.value && selectedCollections.value.length > 0) {
				extendedScope.selectedCollections = selectedCollections.value;
			}
			else if (collectionFilterMode.value === 'exclude' && excludedCollections.value && excludedCollections.value.length > 0) {
				extendedScope.excludedCollections = excludedCollections.value;
			}

			// Add content-specific collection selection
			if (contentCollections.value && contentCollections.value.length > 0) {
				extendedScope.contentCollections = contentCollections.value;
			}

			// Add users granular options if users is selected
			if (scope.users) {
				extendedScope.usersGranular = { ...usersGranular };

				// Phase 6: Add users selection options
				const usersSelection: Record<string, any> = {};
				if (selectedRoles.value && selectedRoles.value.length > 0) {
					usersSelection.selectedRoles = selectedRoles.value;
				}
				if (selectedPolicies.value && selectedPolicies.value.length > 0) {
					usersSelection.selectedPolicies = selectedPolicies.value;
				}
				if (selectedPermissions.value && selectedPermissions.value.length > 0) {
					usersSelection.selectedPermissions = selectedPermissions.value;
				}
				if (selectedUserAccounts.value && selectedUserAccounts.value.length > 0) {
					usersSelection.selectedUsers = selectedUserAccounts.value;
				}
				if (selectedAccessRules.value && selectedAccessRules.value.length > 0) {
					usersSelection.selectedAccess = selectedAccessRules.value;
				}
				if (Object.keys(usersSelection).length > 0) {
					extendedScope.usersSelection = usersSelection;
				}
			}

			// Add selected flows if flows is selected and specific flows are chosen
			if (scope.flows && selectedFlows.value && selectedFlows.value.length > 0) {
				extendedScope.selectedFlows = selectedFlows.value;
			}

			// Add selected extensions if extensions is selected and specific ones are chosen
			if (scope.extensions && selectedExtensions.value && selectedExtensions.value.length > 0) {
				extendedScope.selectedExtensions = selectedExtensions.value;
			}

			// Issue #013: Add settings filtering to scope
			if (scope.settings && settingsFilterMode.value === 'selected') {
				extendedScope.selectedSettings = selectedSettingsFields.value;
			}

			// Issue #013: Add translations filtering to scope
			if (scope.translations && translationsFilterMode.value === 'filtered') {
				if (selectedLanguages.value && selectedLanguages.value.length > 0) {
					extendedScope.selectedLanguages = selectedLanguages.value;
				}
				if (translationKeyPattern.value.trim()) {
					extendedScope.translationKeyPattern = translationKeyPattern.value.trim();
				}
			}

			// Issue #014: Add bookmarks (presets) filtering to scope
			if (scope.presets && bookmarksFilterMode.value === 'selected') {
				extendedScope.selectedPresets = selectedBookmarks.value;
			}

			// Issue #014: Add insights (dashboards) filtering to scope
			if (scope.dashboards && insightsFilterMode.value === 'selected') {
				extendedScope.selectedDashboards = selectedInsights.value;
			}

			// Issue #009: Add files/folders filtering to scope
			if (scope.files && filesFilterMode.value === 'selected') {
				extendedScope.selectedFolders = selectedFolders.value;
			}

			// Issue #009: Add comments integration to scope
			if (scope.comments) {
				extendedScope.includeCommentsForContent = includeCommentsForContent.value;
			}

			// Files defaults to true if content is selected (backward compatibility)
			if (scope.content && !migrationOptionsSelections.value?.includes('files')) {
				extendedScope.files = true;
			}

			response.value = await api.post(`/migration/${dryRun ? 'dry-run' : 'run'}`, { baseURL, token, scope: extendedScope }, {
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
			// Granular options
			usersGranular,
			selectedFlows,
			selectedExtensions,
			// Issue #017: allFlows for showing hidden count
			allFlows,
			availableFlows,
			availableExtensions,
			// Tab-based UI
			activeTab,
			// Phase 6: Users tab specific item selection
			availableRoles,
			availablePolicies,
			availablePermissions,
			availableUsers,
			availableAccessRules,
			selectedRoles,
			selectedPolicies,
			selectedPermissions,
			selectedUserAccounts,
			selectedAccessRules,
			// Issue #013: Settings filtering
			settingsFilterMode,
			availableSettingsFields,
			selectedSettingsFields,
			isLoadingSettings,
			// Issue #013: Translations filtering
			translationsFilterMode,
			availableLanguages,
			selectedLanguages,
			translationKeyPattern,
			isLoadingLanguages,
			// Issue #014: Bookmarks (Presets) filtering
			// Issue #017: allBookmarks for showing hidden count
			bookmarksFilterMode,
			allBookmarks,
			availableBookmarks,
			selectedBookmarks,
			isLoadingBookmarks,
			// Issue #014: Insights (Dashboards) filtering
			insightsFilterMode,
			availableInsights,
			selectedInsights,
			isLoadingInsights,
			// Issue #009: Files filtering
			filesFilterMode,
			availableFolders,
			selectedFolders,
			isLoadingFolders,
			// Issue #009: Comments integration
			includeCommentsForContent,
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

					<!-- Tab-based Granular Options -->
					<div v-if="(forceSchema || (validationMessage && validationMessage.status === 'success')) && migrationOptionsSelections && migrationOptionsSelections.length > 0" class="migration-tabs-container">
						<v-tabs v-model="activeTab" class="migration-tabs">
							<v-tab
								v-if="migrationOptionsSelections?.includes('schema')"
								value="schema"
							>
								<v-icon name="schema" small />
								Schema
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('content')"
								value="content"
							>
								<v-icon name="table_rows" small />
								Content
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('files')"
								value="files"
							>
								<v-icon name="folder" small />
								Files
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('users')"
								value="users"
							>
								<v-icon name="people" small />
								Users
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('presets')"
								value="presets"
							>
								<v-icon name="bookmark" small />
								Bookmarks
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('dashboards')"
								value="dashboards"
							>
								<v-icon name="insights" small />
								Insights
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('extensions')"
								value="extensions"
							>
								<v-icon name="extension" small />
								Extensions
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('flows')"
								value="flows"
							>
								<v-icon name="bolt" small />
								Flows
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('settings')"
								value="settings"
							>
								<v-icon name="settings" small />
								Settings
							</v-tab>
							<v-tab
								v-if="migrationOptionsSelections?.includes('translations')"
								value="translations"
							>
								<v-icon name="translate" small />
								Translations
							</v-tab>
						</v-tabs>

						<v-tabs-items v-model="activeTab" class="migration-tab-content">
							<!-- Schema Tab -->
							<v-tab-item value="schema">
								<div class="tab-panel">
									<h4>Schema Collection Filtering</h4>
									<p class="tab-hint">Select which collections to include in schema migration.</p>

									<div class="filter-mode-selector">
										<v-radio
											v-model="collectionFilterMode"
											value="all"
											label="All collections"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="collectionFilterMode"
											value="include"
											label="Include specific collections"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="collectionFilterMode"
											value="exclude"
											label="Exclude specific collections"
											:disabled="lockInterface"
										/>
									</div>

									<v-select
										v-if="collectionFilterMode === 'include'"
										v-model="selectedCollections"
										:items="availableCollections"
										:disabled="lockInterface || isLoadingCollections"
										:loading="isLoadingCollections"
										:multiple-preview-threshold="2"
										item-text="label"
										item-value="value"
										placeholder="Select collections to include..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="add_circle" />
										</template>
									</v-select>

									<v-select
										v-if="collectionFilterMode === 'exclude'"
										v-model="excludedCollections"
										:items="availableCollections"
										:disabled="lockInterface || isLoadingCollections"
										:loading="isLoadingCollections"
										:multiple-preview-threshold="2"
										item-text="label"
										item-value="value"
										placeholder="Select collections to exclude..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="remove_circle" />
										</template>
									</v-select>
								</div>
							</v-tab-item>

							<!-- Content Tab -->
							<v-tab-item value="content">
								<div class="tab-panel">
									<h4>Content Collection Filtering</h4>
									<p class="tab-hint">Select which collections' content to migrate.</p>

									<v-select
										v-if="collectionFilterMode === 'include' && selectedCollections && selectedCollections.length > 0"
										v-model="contentCollections"
										:items="availableCollections.filter(c => selectedCollections.includes(c.value))"
										:disabled="lockInterface || isLoadingCollections"
										:loading="isLoadingCollections"
										:multiple-preview-threshold="2"
										item-text="label"
										item-value="value"
										placeholder="All schema-selected collections (or select specific)"
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="table_rows" />
										</template>
									</v-select>

									<v-notice v-else-if="collectionFilterMode === 'all'" type="info" class="tab-notice">
										All collections will have their content migrated. Use the Schema tab to filter collections first.
									</v-notice>

									<v-notice v-else-if="collectionFilterMode === 'exclude'" type="info" class="tab-notice">
										Content from all non-excluded collections will be migrated.
									</v-notice>

									<v-notice v-else type="warning" class="tab-notice">
										Please select collections in the Schema tab first.
									</v-notice>

									<!-- Comments Integration -->
									<div v-if="migrationOptionsSelections?.includes('comments')" class="comments-integration">
										<v-divider />
										<h4>Comments</h4>
										<v-checkbox
											v-model="includeCommentsForContent"
											label="Include comments for selected collections"
											:disabled="lockInterface"
										/>
										<p class="tab-hint">
											When enabled, only comments for the selected collections will be migrated.
											When disabled, all comments will be migrated.
										</p>
									</div>
								</div>
							</v-tab-item>

							<!-- Files Tab -->
							<v-tab-item value="files">
								<div class="tab-panel">
									<h4>Files & Folders Filtering</h4>
									<p class="tab-hint">Configure which files and folders to migrate.</p>

									<div class="files-filter-mode">
										<v-radio
											v-model="filesFilterMode"
											value="all"
											label="All files and folders"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="filesFilterMode"
											value="selected"
											label="Selected folders only"
											:disabled="lockInterface"
										/>
									</div>

									<v-select
										v-if="filesFilterMode === 'selected'"
										v-model="selectedFolders"
										:items="availableFolders"
										:disabled="lockInterface || isLoadingFolders"
										:loading="isLoadingFolders"
										:multiple-preview-threshold="3"
										item-text="label"
										item-value="value"
										placeholder="Select folders to include..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="folder" />
										</template>
									</v-select>

									<v-notice v-if="filesFilterMode === 'selected' && (!selectedFolders || selectedFolders.length === 0)" type="warning" class="tab-notice">
										No folders selected. Files migration will be skipped.
									</v-notice>

									<v-notice v-else-if="filesFilterMode === 'all'" type="info" class="tab-notice">
										All files and folders will be migrated.
									</v-notice>

									<div class="files-options">
										<v-checkbox
											v-model="scope.folders"
											label="Include folder structure"
											:disabled="lockInterface"
										/>
									</div>
								</div>
							</v-tab-item>

							<!-- Users Tab -->
							<v-tab-item value="users">
								<div class="tab-panel">
									<h4>Users Granular Options</h4>
									<p class="tab-hint">Select which user-related data to migrate and optionally filter specific items.</p>

									<!-- Roles Section -->
									<div class="users-section">
										<div class="section-header">
											<v-checkbox
												v-model="usersGranular.roles"
												label="Roles"
												:disabled="lockInterface"
											/>
											<span v-if="selectedRoles && selectedRoles.length > 0" class="selection-badge">
												{{ selectedRoles.length }} selected
											</span>
										</div>
										<v-select
											v-if="usersGranular.roles"
											v-model="selectedRoles"
											:items="availableRoles.map(r => ({ text: r.name, value: r.id }))"
											:disabled="lockInterface"
											multiple
											placeholder="All roles (or select specific)"
											class="section-select"
										/>
									</div>

									<!-- Policies Section -->
									<div class="users-section">
										<div class="section-header">
											<v-checkbox
												v-model="usersGranular.policies"
												label="Policies"
												:disabled="lockInterface || !usersGranular.roles"
											/>
											<span v-if="selectedPolicies && selectedPolicies.length > 0" class="selection-badge">
												{{ selectedPolicies.length }} selected
											</span>
										</div>
										<v-select
											v-if="usersGranular.policies"
											v-model="selectedPolicies"
											:items="availablePolicies.map(p => ({ text: p.name, value: p.id }))"
											:disabled="lockInterface || !usersGranular.roles"
											multiple
											placeholder="All policies (or select specific)"
											class="section-select"
										/>
									</div>

									<!-- Permissions Section -->
									<div class="users-section">
										<div class="section-header">
											<v-checkbox
												v-model="usersGranular.permissions"
												label="Permissions"
												:disabled="lockInterface || !usersGranular.policies"
											/>
											<span v-if="selectedPermissions && selectedPermissions.length > 0" class="selection-badge">
												{{ selectedPermissions.length }} selected
											</span>
										</div>
										<v-select
											v-if="usersGranular.permissions"
											v-model="selectedPermissions"
											:items="availablePermissions.map(p => ({ text: `${p.collection} - ${p.action}`, value: p.id }))"
											:disabled="lockInterface || !usersGranular.policies"
											multiple
											placeholder="All permissions (or select specific)"
											class="section-select"
										/>
									</div>

									<!-- User Accounts Section -->
									<div class="users-section">
										<div class="section-header">
											<v-checkbox
												v-model="usersGranular.userAccounts"
												label="User Accounts"
												:disabled="lockInterface || !usersGranular.roles"
											/>
											<span v-if="selectedUserAccounts && selectedUserAccounts.length > 0" class="selection-badge">
												{{ selectedUserAccounts.length }} selected
											</span>
										</div>
										<v-select
											v-if="usersGranular.userAccounts"
											v-model="selectedUserAccounts"
											:items="availableUsers.map(u => ({ text: u.email || `${u.first_name} ${u.last_name}`.trim() || u.id, value: u.id }))"
											:disabled="lockInterface || !usersGranular.roles"
											multiple
											placeholder="All users (or select specific)"
											class="section-select"
										/>
									</div>

									<!-- Access Rules Section -->
									<div class="users-section">
										<div class="section-header">
											<v-checkbox
												v-model="usersGranular.access"
												label="Access Rules"
												:disabled="lockInterface || !usersGranular.userAccounts || !usersGranular.policies"
											/>
											<span v-if="selectedAccessRules && selectedAccessRules.length > 0" class="selection-badge">
												{{ selectedAccessRules.length }} selected
											</span>
										</div>
										<v-select
											v-if="usersGranular.access"
											v-model="selectedAccessRules"
											:items="availableAccessRules.map(a => ({ text: `${a.role || a.user || 'Public'} - ${a.policy}`, value: a.id }))"
											:disabled="lockInterface || !usersGranular.userAccounts || !usersGranular.policies"
											multiple
											placeholder="All access rules (or select specific)"
											class="section-select"
										/>
									</div>

									<div class="dependency-hint">
										<v-icon name="info" small />
										<span>Dependencies: Policies require Roles, Permissions require Policies, User Accounts require Roles, Access requires Users + Policies. Selecting a user auto-selects their role.</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Bookmarks Tab (Issue #014) -->
							<v-tab-item value="presets">
								<div class="tab-panel">
									<h4>Bookmarks Filtering</h4>
									<p class="tab-hint">Choose which bookmarks (presets) to migrate from the source instance.</p>

									<div class="filter-mode-selector">
										<v-radio
											v-model="bookmarksFilterMode"
											value="all"
											label="Migrate all bookmarks"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="bookmarksFilterMode"
											value="selected"
											label="Select specific bookmarks"
											:disabled="lockInterface"
										/>
									</div>

									<!-- Issue #017: Show notice when bookmarks are filtered by collection -->
									<v-notice
										v-if="allBookmarks.length > availableBookmarks.length"
										type="info"
										class="tab-notice"
									>
										{{ allBookmarks.length - availableBookmarks.length }} bookmark(s) hidden
										(collection not selected for migration).
									</v-notice>

									<v-select
										v-if="bookmarksFilterMode === 'selected'"
										v-model="selectedBookmarks"
										:items="availableBookmarks"
										:disabled="lockInterface || isLoadingBookmarks"
										:loading="isLoadingBookmarks"
										:multiple-preview-threshold="3"
										item-text="text"
										item-value="value"
										placeholder="Select bookmarks to migrate..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="bookmark" />
										</template>
									</v-select>

									<div v-if="bookmarksFilterMode === 'selected' && selectedBookmarks && selectedBookmarks.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>{{ selectedBookmarks.length }} bookmark(s) selected for migration.</span>
									</div>

									<v-notice v-if="bookmarksFilterMode === 'selected' && (!selectedBookmarks || selectedBookmarks.length === 0) && !isLoadingBookmarks" type="warning" class="tab-notice">
										<v-icon name="warning" small />
										No bookmarks selected. Bookmarks migration will be skipped.
									</v-notice>

									<div class="bookmarks-merge-note">
										<v-icon name="info" small />
										<span>Bookmarks are merged by ID. Existing bookmarks on the target will be updated if IDs match.</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Insights Tab (Issue #014) -->
							<v-tab-item value="dashboards">
								<div class="tab-panel">
									<h4>Insights Filtering</h4>
									<p class="tab-hint">Choose which dashboards to migrate from the source instance. Associated panels will be included automatically.</p>

									<div class="filter-mode-selector">
										<v-radio
											v-model="insightsFilterMode"
											value="all"
											label="Migrate all dashboards"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="insightsFilterMode"
											value="selected"
											label="Select specific dashboards"
											:disabled="lockInterface"
										/>
									</div>

									<v-select
										v-if="insightsFilterMode === 'selected'"
										v-model="selectedInsights"
										:items="availableInsights.map(i => ({ text: `${i.text} (${i.panelCount} panels)`, value: i.value }))"
										:disabled="lockInterface || isLoadingInsights"
										:loading="isLoadingInsights"
										:multiple-preview-threshold="3"
										item-text="text"
										item-value="value"
										placeholder="Select dashboards to migrate..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="insights" />
										</template>
									</v-select>

									<div v-if="insightsFilterMode === 'selected' && selectedInsights && selectedInsights.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>
											{{ selectedInsights.length }} dashboard(s) selected
											({{ availableInsights.filter(i => selectedInsights.includes(i.value)).reduce((sum, i) => sum + i.panelCount, 0) }} panels will be included).
										</span>
									</div>

									<v-notice v-if="insightsFilterMode === 'selected' && (!selectedInsights || selectedInsights.length === 0) && !isLoadingInsights" type="warning" class="tab-notice">
										<v-icon name="warning" small />
										No dashboards selected. Insights migration will be skipped.
									</v-notice>

									<div class="insights-merge-note">
										<v-icon name="info" small />
										<span>Dashboards and their panels are migrated together. Selecting a dashboard automatically includes all its panels.</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Flows Tab -->
							<v-tab-item value="flows">
								<div class="tab-panel">
									<h4>Flow Selection</h4>
									<p class="tab-hint">Select specific flows to migrate, or leave empty for all.</p>

									<!-- Issue #017: Show notice when flows are filtered by collection -->
									<v-notice
										v-if="allFlows.length > availableFlows.length"
										type="info"
										class="tab-notice"
									>
										{{ allFlows.length - availableFlows.length }} flow(s) hidden
										(trigger collection not selected for migration).
									</v-notice>

									<v-select
										v-model="selectedFlows"
										:items="availableFlows.map(f => ({ text: f.name, value: f.id }))"
										:disabled="lockInterface"
										multiple
										placeholder="All flows (or select specific)"
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="bolt" />
										</template>
									</v-select>

									<div v-if="selectedFlows && selectedFlows.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>{{ selectedFlows.length }} flow(s) selected. Related operations will be included automatically.</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Extensions Tab -->
							<v-tab-item value="extensions">
								<div class="tab-panel">
									<h4>Extension Selection</h4>
									<p class="tab-hint">Select specific extensions to migrate, or leave empty for all registry extensions.</p>

									<v-select
										v-model="selectedExtensions"
										:items="availableExtensions
											.filter(e => e.source === 'registry')
											.map(e => ({ text: e.name, value: e.name }))"
										:disabled="lockInterface"
										multiple
										placeholder="All registry extensions (or select specific)"
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="extension" />
										</template>
									</v-select>

									<div v-if="selectedExtensions && selectedExtensions.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>{{ selectedExtensions.length }} extension(s) selected.</span>
									</div>

									<div v-if="availableExtensions.some(e => e.source === 'local')" class="local-extensions-note">
										<v-icon name="info" small />
										<span>
											{{ availableExtensions.filter(e => e.source === 'local').length }} local extension(s) found.
											Local extensions cannot be auto-migrated and must be installed manually on the target.
										</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Settings Tab (Issue #013) -->
							<v-tab-item value="settings">
								<div class="tab-panel">
									<h4>Settings Filtering</h4>
									<p class="tab-hint">Choose which settings to migrate from the source instance.</p>

									<div class="filter-mode-selector">
										<v-radio
											v-model="settingsFilterMode"
											value="all"
											label="Migrate all settings"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="settingsFilterMode"
											value="selected"
											label="Select specific settings"
											:disabled="lockInterface"
										/>
									</div>

									<v-select
										v-if="settingsFilterMode === 'selected'"
										v-model="selectedSettingsFields"
										:items="availableSettingsFields"
										:disabled="lockInterface || isLoadingSettings"
										:loading="isLoadingSettings"
										:multiple-preview-threshold="3"
										item-text="text"
										item-value="value"
										placeholder="Select settings fields to migrate..."
										multiple
										class="tab-select"
									>
										<template #prepend>
											<v-icon name="tune" />
										</template>
									</v-select>

									<div v-if="settingsFilterMode === 'selected' && selectedSettingsFields && selectedSettingsFields.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>{{ selectedSettingsFields.length }} setting(s) selected for migration.</span>
									</div>

									<v-notice v-if="settingsFilterMode === 'selected' && (!selectedSettingsFields || selectedSettingsFields.length === 0) && !isLoadingSettings" type="warning" class="tab-notice">
										<v-icon name="warning" small />
										No settings selected. Settings migration will be skipped.
									</v-notice>

									<div class="settings-merge-note">
										<v-icon name="info" small />
										<span>Settings are merged with the target instance. Source values will override target values for selected fields.</span>
									</div>
								</div>
							</v-tab-item>

							<!-- Translations Tab (Issue #013) -->
							<v-tab-item value="translations">
								<div class="tab-panel">
									<h4>Translations Filtering</h4>
									<p class="tab-hint">Filter translations by language or key pattern.</p>

									<div class="filter-mode-selector">
										<v-radio
											v-model="translationsFilterMode"
											value="all"
											label="Migrate all translations"
											:disabled="lockInterface"
										/>
										<v-radio
											v-model="translationsFilterMode"
											value="filtered"
											label="Filter translations"
											:disabled="lockInterface"
										/>
									</div>

									<div v-if="translationsFilterMode === 'filtered'" class="translations-filters">
										<div class="filter-section">
											<h5>Language Selection</h5>
											<v-select
												v-model="selectedLanguages"
												:items="availableLanguages"
												:disabled="lockInterface || isLoadingLanguages"
												:loading="isLoadingLanguages"
												:multiple-preview-threshold="3"
												item-text="text"
												item-value="value"
												placeholder="All languages (or select specific)"
												multiple
												class="tab-select"
											>
												<template #prepend>
													<v-icon name="language" />
												</template>
											</v-select>
										</div>

										<div class="filter-section">
											<h5>Key Pattern Filter (RegEx)</h5>
											<v-input
												v-model="translationKeyPattern"
												:disabled="lockInterface"
												placeholder="e.g., ^admin\\. or menu_.*"
												class="tab-input"
											>
												<template #prepend>
													<v-icon name="search" />
												</template>
											</v-input>
											<p class="filter-hint">Use regular expressions to filter translation keys. Leave empty for all keys.</p>
										</div>
									</div>

									<div v-if="translationsFilterMode === 'filtered' && selectedLanguages && selectedLanguages.length > 0" class="selection-info">
										<v-icon name="check_circle" small />
										<span>{{ selectedLanguages.length }} language(s) selected.</span>
									</div>

									<v-notice v-if="translationsFilterMode === 'filtered' && (!selectedLanguages || selectedLanguages.length === 0) && !isLoadingLanguages" type="warning" class="tab-notice">
										<v-icon name="warning" small />
										No languages selected. Translations migration will be skipped.
									</v-notice>

									<div class="translations-merge-note">
										<v-icon name="info" small />
										<span>Translations are merged by key. Existing translations on the target will be updated if keys match.</span>
									</div>
								</div>
							</v-tab-item>
						</v-tabs-items>
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

/* Tab-based UI styles */
.migration-tabs-container {
	margin-top: 20px;
}

.migration-tabs {
	border-bottom: 2px solid var(--theme--border-color);
	display: flex;
	flex-wrap: wrap;
}

.migration-tabs .v-tab {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 16px;
	font-size: 14px;
	font-weight: 500;
	color: var(--theme--foreground-subdued);
	background: transparent;
	border: none;
	border-bottom: 2px solid transparent;
	margin-bottom: -2px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.migration-tabs .v-tab:hover {
	color: var(--theme--foreground);
	background-color: var(--theme--background-normal);
}

.migration-tabs .v-tab.active {
	color: var(--theme--primary);
	border-bottom-color: var(--theme--primary);
}

.migration-tabs .v-tab .v-icon {
	--v-icon-size: 18px;
}

.migration-tab-content {
	margin-top: 0;
}

.tab-panel {
	padding: 20px;
	background-color: var(--theme--background-normal);
	border: 1px solid var(--theme--border-color);
	border-top: none;
	border-radius: 0 0 var(--theme--border-radius) var(--theme--border-radius);
}

.tab-panel h4 {
	margin: 0 0 8px 0;
	font-weight: 600;
	font-size: 14px;
	color: var(--theme--foreground);
}

.tab-panel .tab-hint {
	margin-bottom: 16px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.tab-panel .tab-select {
	width: 100%;
	margin-top: 12px;
}

.tab-panel .tab-notice {
	margin-top: 12px;
}

.filter-mode-selector {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 8px;
}

.filter-mode-selector .v-radio {
	margin: 0;
}

/* Issue #009: Comments integration on Content tab */
.comments-integration {
	margin-top: 20px;
	padding-top: 16px;
}

.comments-integration h4 {
	margin-bottom: 8px;
}

.comments-integration .v-checkbox {
	margin: 0;
}

.comments-integration .tab-hint {
	margin-top: 4px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

/* Issue #009: Files tab styling */
.files-filter-mode {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 16px;
}

.files-filter-mode .v-radio {
	margin: 0;
}

.files-options {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px solid var(--theme--border-color);
}

.files-options .v-checkbox {
	margin: 0;
}

.granular-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 12px;
	margin-bottom: 16px;
}

.granular-grid .v-checkbox {
	margin: 0;
}

.dependency-hint {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 12px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.dependency-hint .v-icon {
	flex-shrink: 0;
	margin-top: 2px;
}

.selection-info {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
	padding: 10px 14px;
	background-color: var(--theme--primary-background);
	border-radius: var(--theme--border-radius);
	font-size: 13px;
	color: var(--theme--primary);
}

.selection-info .v-icon {
	--v-icon-color: var(--theme--primary);
}

.local-extensions-note {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin-top: 12px;
	padding: 10px 14px;
	background-color: var(--theme--warning-background);
	border-radius: var(--theme--border-radius);
	font-size: 13px;
	color: var(--theme--warning);
}

.local-extensions-note .v-icon {
	--v-icon-color: var(--theme--warning);
	flex-shrink: 0;
	margin-top: 2px;
}

@media (max-width: 600px) {
	.migration-tabs .v-tab {
		padding: 8px 12px;
		font-size: 13px;
	}

	.migration-tabs .v-tab .v-icon {
		display: none;
	}

	.granular-grid {
		grid-template-columns: 1fr;
	}

	.files-checkboxes {
		flex-direction: column;
		gap: 12px;
	}
}

/* Phase 6: Users tab specific item selection */
.users-section {
	margin-bottom: 16px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--theme--border-color-subdued);
}

.users-section:last-of-type {
	border-bottom: none;
	margin-bottom: 16px;
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 8px;
}

.section-header .v-checkbox {
	margin: 0;
}

.selection-badge {
	font-size: 11px;
	padding: 2px 8px;
	background-color: var(--theme--primary-background);
	color: var(--theme--primary);
	border-radius: 12px;
	font-weight: 500;
}

.section-select {
	width: 100%;
	margin-top: 8px;
}

/* Issue #013: Settings and Translations tab styles */
/* Issue #014: Bookmarks and Insights tab styles */
.settings-merge-note,
.translations-merge-note,
.bookmarks-merge-note,
.insights-merge-note {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin-top: 16px;
	padding: 12px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}

.settings-merge-note .v-icon,
.translations-merge-note .v-icon,
.bookmarks-merge-note .v-icon,
.insights-merge-note .v-icon {
	flex-shrink: 0;
	margin-top: 2px;
}

.translations-filters {
	margin-top: 16px;
}

.filter-section {
	margin-bottom: 20px;
}

.filter-section:last-child {
	margin-bottom: 0;
}

.filter-section h5 {
	margin: 0 0 8px 0;
	font-weight: 500;
	font-size: 13px;
	color: var(--theme--foreground);
}

.filter-hint {
	margin-top: 6px;
	font-size: 11px;
	color: var(--theme--foreground-subdued);
}

.tab-input {
	width: 100%;
}
</style>
