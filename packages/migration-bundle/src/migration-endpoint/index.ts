import type { Accountability } from '@directus/types';
import type { Schema } from './api';
import { ForbiddenError } from '@directus/errors';
import { defineEndpoint } from '@directus/extensions-sdk';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { toArray } from '@directus/utils';
import notifyUser from '../utils/notify-user';
import saveToFile from '../utils/save-file';
import { validate_data, validate_migration, validate_system } from '../utils/validate';
import { enhancedFetch, initLimiter } from './api';
import extractContent from './composables/extract-data';
import extractSystemData from './composables/extract-system';
import migrateAccess from './composables/migrate-access';
import migrateComments from './composables/migrate-comments';
import migrateDashboards from './composables/migrate-dashboards';
import migrateData from './composables/migrate-data';
import migrateExtensions from './composables/migrate-extensions';
import migrateFiles from './composables/migrate-files';
import migrateFlows from './composables/migrate-flows';
import migrateFolders from './composables/migrate-folders';
import migratePanels from './composables/migrate-panels';
import migratePermissions from './composables/migrate-permissions';
import migratePolicies from './composables/migrate-policies';
import migratePresets from './composables/migrate-presets';
import migrateRoles from './composables/migrate-roles';
import { checkSchema, migrateSchema } from './composables/migrate-schema';
import migrateSettings from './composables/migrate-settings';
import migrateTranslations from './composables/migrate-translations';
import migrateUsers from './composables/migrate-users';
import updateRequiredFields from './composables/update-required-fields';
import Icon from './templates/icon';
import spinner from './templates/spinner';

export default defineEndpoint({
	id: 'migration',
	handler: (router, { env, services, database, getSchema }) => {
		const {
			AssetsService,
			FieldsService,
			FilesService,
			FoldersService,
			NotificationsService,
			SchemaService,

		} = services;

		const storage = toArray(env.STORAGE_LOCATIONS)[0];

		router.get('/*', async (req, res) => {
			if (req.url === '/defaults') {
				// Return ENV-based defaults
				const defaults = {
					baseURL: env.MIGRATION_BUNDLE_DEFAULT_URL || '',
					token: env.MIGRATION_BUNDLE_DEFAULT_TOKEN || '',
					options: env.MIGRATION_BUNDLE_DEFAULT_OPTIONS
						? String(env.MIGRATION_BUNDLE_DEFAULT_OPTIONS).split(',').map((s: string) => s.trim())
						: [],
				};
				res.json(defaults);
			}
			else if (req.url === '/presets') {
				// Get migration presets for current user
				const accountability: Accountability | null = 'accountability' in req ? req.accountability as Accountability : null;

				if (!accountability?.admin) {
					res.sendStatus(401);
					return;
				}

				try {
					// Query presets with proper priority (user > role > global)
					const presets = await database('directus_presets')
						.where({
							collection: 'migration_bundle',
							user: accountability.user,
						})
						.orWhere(function () {
							this.where({
								collection: 'migration_bundle',
								user: null,
								role: accountability.role,
							});
						})
						.orWhere(function () {
							this.where({
								collection: 'migration_bundle',
								user: null,
								role: null,
							});
						})
						.whereNotNull('bookmark')
						.orderBy([
							{ column: 'user', order: 'desc', nulls: 'last' },
							{ column: 'role', order: 'desc', nulls: 'last' },
							{ column: 'bookmark', order: 'asc' },
						]);

					res.json({ data: presets });
				}
				catch (error) {
					console.error('Failed to load presets:', error);
					res.json({ data: [] });
				}
			}
			else {
				res.sendStatus(400);
			}
		});

		router.post('/*', async (req, res, next) => {
			if (req.url === '/presets') {
				// Create or update migration preset
				const accountability: Accountability | null = 'accountability' in req ? req.accountability as Accountability : null;

				if (!accountability?.admin) {
					res.sendStatus(401);
					return;
				}

				try {
					const preset = {
						collection: 'migration_bundle',
						bookmark: req.body.name || `Migration Config ${new Date().toLocaleDateString()}`,
						user: req.body.scope === 'user'
							? accountability.user
							: (req.body.scope === 'global' ? null : accountability.user),
						role: req.body.scope === 'role' ? accountability.role : null,
						icon: 'sync',
						color: '#2ECDA7',
						layout: 'custom',
						layout_options: JSON.stringify({
							baseURL: req.body.baseURL,
							token: req.body.token,
							selectedOptions: req.body.options,
						}),
					};

					// Check if preset exists for update
					if (req.body.id) {
						await database('directus_presets')
							.where({ id: req.body.id })
							.update(preset);

						res.json({ data: { ...preset, id: req.body.id } });
					}
					else {
						const [id] = await database('directus_presets').insert(preset);
						res.json({ data: { ...preset, id } });
					}
				}
				catch (error) {
					console.error('Failed to save preset:', error);
					res.status(500).json({ error: 'Failed to save preset' });
				}

				return;
			}

			if (!['/run', '/dry-run', '/check'].includes(req.url)) {
				next(new ForbiddenError());
				return;
			}

			;

			const accountability: Accountability | null = 'accountability' in req ? req.accountability as Accountability : null;

			if (!accountability?.admin) {
				next(new ForbiddenError());
				return;
			}

			const isDryRun = req.url === '/dry-run';
			const isCheck = req.url === '/check';

			if (!req.body.baseURL || !req.body.token || !req.body.scope) {
				next(new ForbiddenError());
				return;
			}

			const baseURL = req.body.baseURL;
			const token = req.body.token;
			const scope = req.body.scope;

			const schema = await getSchema();
			const limiter = await initLimiter();

			// Services
			const fileService = new FilesService({
				accountability,
				schema,
			});

			const fieldService = new FieldsService({
				accountability,
				schema,
			});

			const folderService = new FoldersService({
				accountability,
				schema,
			});

			const assetService = new AssetsService({
				accountability,
				schema,
			});

			const notificationService = new NotificationsService({
				accountability,
				schema,
			});

			const schemaService = new SchemaService({
				knex: database,
				accountability,
			});

			// Destination API Client
			const client = createDirectus<Schema>(baseURL, {
				globals: {
					fetch: limiter.wrap(enhancedFetch),
				},
			}).with(staticToken(token)).with(rest());

			if (isCheck) {
				const currentSchema = await schemaService.snapshot();
				const response = await checkSchema({ client, schema: currentSchema }); // Can be { status: 204 } if there is no change

				if (response && 'errors' in response) {
					const message = Array.isArray(response.errors) && response.errors.length > 0 ? response.errors[0]?.message : 'Unknown';
					res.json({ status: 'danger', icon: 'error', message });
				}
				else {
					res.json({ status: 'success', icon: 'check', message: 'This instance is compatible for migration.' });
				}
			}
			else {
				res.writeHead(200, {
					'Content-Type': 'text/plain',
					'Transfer-Encoding': 'chunked',
				});

				res.write(isDryRun ? '## Staring Dry Run Extraction\r\n\r\n' : '## Staring Extraction\r\n\r\n');

				// Create Working Directory
				const folderName = `Migration ${new Date().toISOString()}`;

				const folder = await folderService.createOne({
					name: folderName,
					parent: null,
				});

				res.write(`Created new folder ${folderName}\r\n\r\n`);

				// Step 1: Extarction
				try {
					// Step 1.1: Schema
					res.write(`<div class="pending"><h3>${spinner} Creating Schema Snapshot</h3>\r\n\r\n`);
					const currentSchema = await schemaService.snapshot();
					await saveToFile(currentSchema, 'schema', fileService, folder, storage);
					res.write(`</div><h3 class="done">${Icon} Schema Snapshot Created</h3>\r\n\r\n`);

					// Step 1.2: System Data
					res.write(`<div class="pending"><h3>${spinner} Extracting System Data</h3>\r\n\r\n`);
					const systemFetch = await extractSystemData({ res, services, accountability, schema, scope, folder, storage });

					if (systemFetch.system_errors) {
						const message = Array.isArray(systemFetch.system_errors.errors) && systemFetch.system_errors.errors.length > 0 ? systemFetch.system_errors.errors[0]?.message : 'Unknown';
						res.write(`Error Occurred: ${message}\r\n`);
						console.error(systemFetch.system_errors);
						await notifyUser(notificationService, accountability, systemFetch.system_errors);
					}

					// Validation
					res.write('Validating System Data: ');

					let isValid = await validate_system({
						...systemFetch,
						scope,
					});

					res.write(isValid ? `</div><h3 class="done">${Icon} System Data Extracted</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} System Data Extract Failed</h3>\r\n\r\n`);

					// Step 1.3: Data
					res.write(`<div class="pending"><h3>${spinner} Extracting Content</h3>\r\n\r\n`);
					const dataFetch = await extractContent({ res, services, accountability, schema, scope, folder, storage });
					res.write('Validating Content: ');

					isValid = isValid
						? await validate_data({
							...dataFetch,
							scope,
						})
						: isValid;

					res.write(isValid ? `</div><h3 class="done">${Icon} Content Extracted</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} System Data Extract Failed</h3>\r\n\r\n`);

					// Step 2: Migration
					res.write(isDryRun ? '## Checking Destination\r\n\r\n' : '## Starting Migration\r\n\r\n');
					// Step 2.1 Schema
					res.write(`<div class="pending"><h3>${spinner} Applying Schema</h3>\r\n\r\n`);
					const response = await migrateSchema({ res, client, schema: currentSchema, dry_run: isDryRun, force: scope.force }); // Can be { status: 204 } if there is no change

					if ('errors' in response) {
						const message = Array.isArray(response.errors) && response.errors.length > 0 ? response.errors[0]?.message : 'Unknown';
						await notifyUser(notificationService, accountability, response);
						res.write(`</div><h3 class="error">${Icon} Schema Failed to Apply</h3>\r\n\r\n`);
						res.write(`Error Occurred: ${message}\r\n\r\n`);
					}
					else {
						res.write(`</div><h3 class="done">${Icon} Schema Applied</h3>\r\n\r\n`);

						// Step 2.2: Users
						if (scope.users) {
							res.write(`<div class="pending"><h3>${spinner} Migrating Users</h3>\r\n\r\n`);
							const role_response = await migrateRoles({ res, client, roles: systemFetch.roles, dry_run: isDryRun });
							const policy_response = await migratePolicies({ res, client, policies: systemFetch.policies, dry_run: isDryRun });
							const permission_response = await migratePermissions({ res, client, permissions: systemFetch.permissions, dry_run: isDryRun });
							const user_response = await migrateUsers({ res, client, users: systemFetch.users, roles: systemFetch.roles, dry_run: isDryRun });
							const access_response = await migrateAccess({ res, client, access: systemFetch.access, roles: systemFetch.roles, dry_run: isDryRun });

							const userMigrationValid = await validate_migration([
								role_response,
								policy_response,
								permission_response,
								user_response,
								access_response,
							]);

							res.write(userMigrationValid ? `</div><h3 class="done">${Icon} Users Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Users Migration Failed</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Users Skipped</h3>\r\n\r\n`);
						}

						if (scope.content) {
							res.write(`<div class="pending"><h3>${spinner} Removing Field Requirements</h3>\r\n\r\n`);
							const field_response = await updateRequiredFields({ res, client, service: fieldService, collections: dataFetch.collections, dry_run: isDryRun, task: 'remove' });
							const fieldUpdateValid = await validate_migration([field_response]);
							res.write(fieldUpdateValid ? `</div><h3 class="done">${Icon} Field Requirements Removed</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Failed to Remove Field Requirements</h3>\r\n\r\n`);

							// Step 2.3: Files
							res.write(`<div class="pending"><h3>${spinner} Migrating Files</h3>\r\n\r\n`);
							const folder_response = await migrateFolders({ res, client, folders: systemFetch.folders, dry_run: isDryRun });
							const file_response = await migrateFiles({ res, client, service: assetService, files: dataFetch.files, dry_run: isDryRun });

							const fileMigrationValid = await validate_migration([
								folder_response,
								file_response,
							]);

							res.write(fileMigrationValid ? `</div><h3 class="done">${Icon} Files Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Files Migration Failed</h3>\r\n\r\n`);

							if (fileMigrationValid && fieldUpdateValid) {
								// Step 2.4: Data
								res.write(`<div class="pending"><h3>${spinner} Migrating Collections</h3>\r\n\r\n`);
								const content_response = await migrateData({ res, client, fullData: dataFetch.fullData, singletons: dataFetch.singletons, dry_run: isDryRun });
								const contentMigrationValid = await validate_migration([content_response]);
								res.write(contentMigrationValid ? `</div><h3 class="done">${Icon} Collections Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Collections Migration Failed</h3>\r\n\r\n`);

								if (contentMigrationValid) {
									// Step 2.5: Comments
									if (scope.comments) {
										res.write(`<div class="pending"><h3>${spinner} Migrating Comments</h3>\r\n\r\n`);
										const comments_response = await migrateComments({ res, client, comments: systemFetch.comments, dry_run: isDryRun });
										const contentMigrationValid = await validate_migration([comments_response]);
										res.write(contentMigrationValid ? `</div><h3 class="done">${Icon} Comments Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Comments Migration Failed</h3>\r\n\r\n`);
									}
									else {
										res.write(`<h3 class="skipped">${Icon} Comments Skipped</h3>\r\n\r\n`);
									}
								}
							}

							// Step 2.6: Required Fields
							res.write(`<div class="pending"><h3>${spinner} Updating Required Fields</h3>\r\n\r\n`);
							const fields_response = await updateRequiredFields({ res, client, service: fieldService, collections: dataFetch.collections, dry_run: isDryRun, task: 'add' });
							const fieldsUpdateValid = await validate_migration([fields_response]);
							res.write(fieldsUpdateValid ? `</div><h3 class="done">${Icon} Required Fields Updated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Failed to Update Required Fields</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Content Skipped</h3>\r\n\r\n`);
						}

						// Step 2.7: Dashboards
						if (scope.dashboards) {
							res.write(`<div class="pending"><h3>${spinner} Migrating Insights</h3>\r\n\r\n`);
							const dashboard_response = await migrateDashboards({ res, client, dashboards: systemFetch.dashboards, dry_run: isDryRun });
							const panel_response = await migratePanels({ res, client, panels: systemFetch.panels, dry_run: isDryRun });
							const insightsMigrationValid = await validate_migration([dashboard_response, panel_response]);
							res.write(insightsMigrationValid ? `</div><h3 class="done">${Icon} Insights Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Insights Migration Failed</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Insights Skipped</h3>\r\n\r\n`);
						}

						// Step 2.8: Flows
						if (scope.flows) {
							res.write(`<div class="pending"><h3>${spinner} Migrating Flows</h3>\r\n\r\n`);
							const flows_response = await migrateFlows({ res, client, flows: systemFetch.flows, operations: systemFetch.operations, dry_run: isDryRun });
							const flowsMigrationValid = await validate_migration([flows_response]);
							res.write(flowsMigrationValid ? `</div><h3 class="done">${Icon} Flows Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Flows Migration Failed</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Flows Skipped</h3>\r\n\r\n`);
						}

						// Step 2.9: Settings
						res.write(`<div class="pending"><h3>${spinner} Migrating Settings</h3>\r\n\r\n`);
						const settings_response = await migrateSettings({ res, client, settings: systemFetch.settings, dry_run: isDryRun });
						const settingsMigrationValid = await validate_migration([settings_response]);
						res.write(settingsMigrationValid ? `</div><h3 class="done">${Icon} Settings Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Settings Migration Failed</h3>\r\n\r\n`);

						// Step 2.10: Translations
						res.write(`<div class="pending"><h3>${spinner} Migrating Translations</h3>\r\n\r\n`);
						const translations_response = await migrateTranslations({ res, client, translations: systemFetch.translations, dry_run: isDryRun });
						const translationsMigrationValid = await validate_migration([translations_response]);
						res.write(translationsMigrationValid ? `</div><h3 class="done">${Icon} Translations Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Translations Migration Failed</h3>\r\n\r\n`);

						// Step 2.11: Translations
						if (scope.presets) {
							res.write(`<div class="pending"><h3>${spinner} Migrating Presets</h3>\r\n\r\n`);
							const presets_response = await migratePresets({ res, client, presets: systemFetch.presets, dry_run: isDryRun });
							const presetsMigrationValid = await validate_migration([presets_response]);
							res.write(presetsMigrationValid ? `</div><h3 class="done">${Icon} Presets Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Presets Migration Failed</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Presets Skipped</h3>\r\n\r\n`);
						}

						// Step 2.12: Extensions
						if (scope.extensions) {
							res.write(`<div class="pending"><h3>${spinner} Migrating Extensions</h3>\r\n\r\n`);
							const extensions_response = await migrateExtensions({ res, client, extensions: systemFetch.extensions, dry_run: isDryRun });
							const extensionsMigrationValid = await validate_migration([extensions_response]);
							res.write(extensionsMigrationValid ? `</div><h3 class="done">${Icon} Extensions Migrated</h3>\r\n\r\n` : `</div><h3 class="error">${Icon} Extensions Migration Failed</h3>\r\n\r\n`);
						}
						else {
							res.write(`<h3 class="skipped">${Icon} Extensions Skipped</h3>\r\n\r\n`);
						}
					}

					res.write(`## Migration ${isDryRun ? 'Dry Run' : ''} Complete\r\n\r\n`);
					res.write(`The files can be download from the [file library](/admin/files/folders/${folder}).\r\n\r\n`);
					res.end();
				}
				catch (error) {
					res.write('An unkown error has occured. See log for details');
					res.end();
					console.error(error);
				}
			}
		});

		// DELETE endpoint for presets
		router.delete('/presets/:id', async (req, res) => {
			const accountability: Accountability | null = 'accountability' in req ? req.accountability as Accountability : null;

			if (!accountability?.admin) {
				res.sendStatus(401);
				return;
			}

			try {
				const presetId = Number.parseInt(req.params.id);

				// Only allow deletion of user's own presets or if they have proper permissions
				await database('directus_presets')
					.where({
						id: presetId,
						collection: 'migration_bundle',
						user: accountability.user,
					})
					.delete();

				res.json({ success: true });
			}
			catch (error) {
				console.error('Failed to delete preset:', error);
				res.status(500).json({ error: 'Failed to delete preset' });
			}
		});
	},
});
