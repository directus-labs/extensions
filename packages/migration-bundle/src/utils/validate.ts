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

	return !system_errors && (!scope.users || (
		Array.isArray(roles) && roles.length > 0
		&& Array.isArray(policies) && policies.length > 0
		&& Array.isArray(permissions) && permissions.length > 0
		&& Array.isArray(users) && users.length > 0
		&& Array.isArray(access) && access.length > 0
		&& Array.isArray(shares)
	))
	&& (!scope.content || (
		Array.isArray(folders)
	))
	&& (!scope.dashboards || (
		Array.isArray(dashboards)
		&& Array.isArray(panels)
	))
	&& (!scope.flows || (
		Array.isArray(flows)
		&& Array.isArray(operations)
	))
	&& settings
	&& Array.isArray(translations)
	&& (!scope.presets || (
		Array.isArray(presets) && presets.length > 0
	))
	&& (!scope.extensions || (
		Array.isArray(extensions)
	))
	&& (!scope.comments || (
		Array.isArray(comments)
	));
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
