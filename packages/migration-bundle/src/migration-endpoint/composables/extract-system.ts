import type { Accountability, Permission, Preset, SchemaOverview, Settings, Share } from '@directus/types';
import type { Access, CommentRaw, DashboardRaw, DirectusError, Extension, Folder, ModifiedFlowRaw, OperationRaw, PanelRaw, PolicyRaw, RoleRaw, Scope, SystemExtract, Translation, UserRaw } from '../../types/extension';
import saveToFile from '../../utils/save-file';
import {
	directusDashboardFields,
	directusFlowFields,
	directusFolderFields,
	directusOperationFields,
	directusPanelFields,
	directusPolicyFields,
	directusPresetFields,
	directusRoleFields,
	directusSettingsFields,
	directusUserFields,
} from '../../utils/system-fields';

async function extractSystemData({ res, services, accountability, schema, scope, folder, storage }: { res: any; services: any; accountability: Accountability; schema: SchemaOverview; scope: Scope; folder: string; storage: string }): Promise<SystemExtract> {
	const {
		AccessService,
		CommentsService,
		DashboardsService,
		ExtensionsService,
		FilesService,
		FlowsService,
		FoldersService,
		OperationsService,
		PanelsService,
		PermissionsService,
		PoliciesService,
		PresetsService,
		RolesService,
		SettingsService,
		SharesService,
		TranslationsService,
		UsersService,
	} = services;

	const roleService = new RolesService({ accountability, schema });
	const policyService = new PoliciesService({ accountability, schema });
	const permissionService = new PermissionsService({ accountability, schema });
	const userService = new UsersService({ accountability, schema });
	const accessService = new AccessService({ accountability, schema });
	const folderService = new FoldersService({ accountability, schema });
	const fileService = new FilesService({ accountability, schema });
	const dashboardService = new DashboardsService({ accountability, schema });
	const flowService = new FlowsService({ accountability, schema });
	const panelService = new PanelsService({ accountability, schema });
	const operationService = new OperationsService({ accountability, schema });
	const settingsService = new SettingsService({ accountability, schema });
	const translationService = new TranslationsService({ accountability, schema });
	const presetService = new PresetsService({ accountability, schema });
	const extensionService = new ExtensionsService({ accountability, schema });
	const commentService = new CommentsService({ accountability, schema });
	const shareService = new SharesService({ accountability, schema });

	try {
		res.write(scope.users ? '* Fetching roles' : '* Skipping roles\r\n\r\n');
		const roles: RoleRaw[] = scope.users ? await roleService.readByQuery({ fields: directusRoleFields, limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(roles, 'roles', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.users ? '* Fetching policies' : '* Skipping policies\r\n\r\n');
		const policies: PolicyRaw[] = scope.users ? await policyService.readByQuery({ fields: directusPolicyFields, limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(policies, 'policies', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.users ? '* Fetching permissions' : '* Skipping permissions\r\n\r\n');
		const permissions: Permission[] = scope.users ? await permissionService.readByQuery({ limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(permissions, 'permissions', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.users ? '* Fetching users' : '* Skipping users\r\n\r\n');
		const users: UserRaw[] = scope.users ? await userService.readByQuery({ fields: directusUserFields, limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(users, 'users', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.users ? '* Fetching access' : '* Skipping access\r\n\r\n');
		const access: Access[] = scope.users ? await accessService.readByQuery({ limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(access, 'access', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.content ? '* Fetching folders' : '* Skipping folders\r\n\r\n');
		const folders: Folder[] = scope.content ? await folderService.readByQuery({ fields: directusFolderFields, filter: { id: { _neq: folder } }, limit: -1 }) : [];

		if (scope.content) {
			res.write(' ...');
			await saveToFile(folders, 'folders', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.dashboards ? '* Fetching dashboards' : '* Skipping dashboards\r\n\r\n');
		const dashboards: DashboardRaw[] = scope.dashboards ? await dashboardService.readByQuery({ fields: directusDashboardFields, limit: -1 }) : [];

		if (scope.dashboards) {
			res.write(' ...');
			await saveToFile(dashboards, 'dashboards', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.dashboards ? '* Fetching panels' : '* Skipping panels\r\n\r\n');
		const panels: PanelRaw[] = scope.dashboards ? await panelService.readByQuery({ fields: directusPanelFields, limit: -1 }) : [];

		if (scope.dashboards) {
			res.write(' ...');
			await saveToFile(panels, 'panels', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.flows ? '* Fetching flows' : '* Skipping flows\r\n\r\n');
		const flows: ModifiedFlowRaw[] = scope.flows ? await flowService.readByQuery({ fields: directusFlowFields, limit: -1 }) : [];

		if (scope.flows) {
			res.write(' ...');
			await saveToFile(flows, 'flows', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.flows ? '* Fetching operations' : '* Skipping operations\r\n\r\n');
		const operations: OperationRaw[] = scope.flows ? await operationService.readByQuery({ fields: directusOperationFields, limit: -1 }) : [];

		if (scope.flows) {
			res.write(' ...');
			await saveToFile(operations, 'operations', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write('* Fetching settings');
		const settings: Settings = await settingsService.readSingleton({ fields: directusSettingsFields });
		res.write(' ...');
		await saveToFile(settings, 'settings', fileService, folder, storage);
		res.write('done\r\n\r\n');

		res.write('* Fetching translations');
		const translations: Translation[] = await translationService.readByQuery({ limit: -1 });
		res.write(' ...');
		await saveToFile(translations, 'translations', fileService, folder, storage);
		res.write('done\r\n\r\n');

		res.write(scope.presets ? '* Fetching presets' : '* Skipping presets');
		const presets: Preset[] = scope.presets ? await presetService.readByQuery({ fields: directusPresetFields, limit: -1 }) : [];

		if (scope.presets) {
			res.write(' ...');
			await saveToFile(presets, 'presets', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.extensions ? '* Fetching extensions' : '* Skipping extensions\r\n\r\n');
		const extensions: Extension[] = scope.extensions ? await extensionService.readAll() : [];

		if (scope.extensions) {
			res.write(' ...');
			await saveToFile(extensions, 'extensions', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.comments ? '* Fetching comments' : '* Skipping comments');
		const comments: CommentRaw[] = scope.comments ? await commentService.readByQuery({ limit: -1 }) : [];

		if (scope.comments) {
			res.write(' ...');
			await saveToFile(comments, 'comments', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		res.write(scope.users ? '* Fetching shares' : '* Skipping shares\r\n\r\n');
		const shares: Share[] = scope.users ? await shareService.readByQuery({ limit: -1 }) : [];

		if (scope.users) {
			res.write(' ...');
			await saveToFile(shares, 'shares', fileService, folder, storage);
			res.write('done\r\n\r\n');
		}

		return {
			roles,
			policies,
			permissions,
			users,
			access,
			folders,
			dashboards,
			flows,
			panels,
			operations,
			settings,
			translations,
			presets,
			extensions,
			comments,
			shares,
			system_errors: null,
		};
	}
	catch (error) {
		console.error(error);
		return {
			roles: null,
			policies: null,
			permissions: null,
			users: null,
			access: null,
			folders: null,
			dashboards: null,
			flows: null,
			panels: null,
			operations: null,
			settings: null,
			translations: null,
			presets: null,
			extensions: null,
			comments: null,
			shares: null,
			system_errors: error as DirectusError,
		};
	}
}

export default extractSystemData;
