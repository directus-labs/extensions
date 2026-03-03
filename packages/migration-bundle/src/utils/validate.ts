import type { DataExtract, DirectusError, SystemExtract } from '../types/extension';

export async function validate_system({
	roles,
	policies,
	permissions,
	users,
	access,
	folders,
	// files,
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
	scope,
	system_errors,
}: SystemExtract): Promise<boolean | null> {
	if (!scope)
		return false;

	// Get granular options for users - only validate what was requested
	const usersGranular = scope.usersGranular || {
		roles: true,
		policies: true,
		permissions: true,
		userAccounts: true,
		access: true,
	};

	// Users validation: check each granular option separately
	const usersValid = !scope.users || (
		(!usersGranular.roles || (Array.isArray(roles) && roles.length > 0))
		&& (!usersGranular.policies || (Array.isArray(policies) && policies.length > 0))
		&& (!usersGranular.permissions || Array.isArray(permissions))
		&& (!usersGranular.userAccounts || Array.isArray(users))
		&& (!usersGranular.access || Array.isArray(access))
		&& Array.isArray(shares)
	);

	// Settings and translations: only validate if scope enables them (default true for backward compatibility)
	const shouldValidateSettings = scope.settings !== false;
	const shouldValidateTranslations = scope.translations !== false;

	return !system_errors
		&& usersValid
		&& (!scope.content || Array.isArray(folders))
		&& (!scope.dashboards || (Array.isArray(dashboards) && Array.isArray(panels)))
		&& (!scope.flows || (Array.isArray(flows) && Array.isArray(operations)))
		&& (!shouldValidateSettings || settings !== null)
		&& (!shouldValidateTranslations || Array.isArray(translations))
		&& (!scope.presets || (Array.isArray(presets) && presets.length > 0))
		&& (!scope.extensions || Array.isArray(extensions))
		&& (!scope.comments || Array.isArray(comments));
}

export async function validate_data({
	// skeletonRecords,
	fullData,
	singletons,
	files,
	data_errors,
	scope,
}: DataExtract): Promise<boolean> {
	if (!scope)
		return false;

	return !data_errors && (!scope.content || (fullData != null && singletons != null && files != null));
}

export async function validate_migration(sources: Array<{ response: string; name: string } | DirectusError>): Promise<boolean> {
	let isValid = true;

	sources.forEach((response) => {
		if (!('response' in response)) {
			console.error(`${response.name} ${response?.errors[0]}`);
			isValid = false;
		}
	});

	return isValid;
}
