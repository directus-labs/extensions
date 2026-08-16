import type { useStores } from '@directus/extensions-sdk';
import type { CommandActionContext, CommandConfig } from '../command-palette';
import formatTitle from '@directus/format-title';
import { defineCommands, refreshRegisteredCommands } from '../command-palette';
import { useDeploymentProviders } from '../composables/use-deployment-providers';
import { useUnexpectedError } from '../composables/use-unexpected-error';
import { getDirectusRouter } from '../utils/get-directus-router';
import { isAdminFromStores } from '../utils/is-admin';
import { isModuleEnabled } from '../utils/is-module-enabled';

const group = 'module:deployments';

export const deploymentsCommands = defineCommands({
	groups: ({ stores }) => {
		if (!canReadDeployments(stores)) return [];
		return [{ id: group, name: 'Deployments', icon: 'rocket_launch' }];
	},
	commands: ({ stores, api, i18n }): CommandConfig[] => {
		if (!canReadDeployments(stores)) return [];

		const permissionsStore = stores.usePermissionsStore();
		const isAdmin = isAdminFromStores(stores);
		const canReadRuns = permissionsStore.hasPermission('directus_deployment_runs', 'read');
		const canManageSettings = canManageDeploymentSettings(permissionsStore);
		const { providers, loaded, loading, fetch } = useDeploymentProviders(api, {
			userId: stores.useUserStore().currentUser?.id,
			onError: useUnexpectedError({ stores, i18n }),
		});

		if (!loaded.value && !loading.value) {
			void fetch().then((success) => {
				if (success) refreshRegisteredCommands();
			});
		}

		const visibleProviders = isAdmin
			? providers.value
			: providers.value.filter((provider) => (provider.projects?.length ?? 0) > 0 && canReadRuns);

		return [
			{
				id: 'view-deployments',
				name: 'Go to Deployments',
				icon: 'rocket_launch',
				group,
				keywords: ['deployments', 'deploy'],
				priority: 30,
				action: ({ router }: CommandActionContext) => {
					router.push('/deployments');
				},
			},
			...visibleProviders.map((provider) => {
				const hasProjects = (provider.projects?.length ?? 0) > 0;
				const providerName = formatTitle(provider.provider);

				return {
					id: `view-deployments-provider:${provider.provider}`,
					name: `Go to ${providerName}`,
					icon: provider.provider,
					group,
					keywords: ['deployments', 'deploy', providerName],
					priority: 25,
					action: ({ router }: CommandActionContext) => {
						router.push({
							name: !hasProjects && isAdmin ? 'deployments-provider-settings' : 'deployments-provider-dashboard',
							params: { provider: provider.provider },
						});
					},
				};
			}),
			...(canReadRuns
				? visibleProviders.flatMap((provider) =>
						(provider.projects ?? []).map((project) => ({
							id: `view-deployments-project:${provider.provider}:${project.id}`,
							name: `Go to ${project.name}`,
							icon: provider.provider,
							group,
							keywords: ['deployments', 'deploy', formatTitle(provider.provider), project.name],
							priority: 20,
							action: ({ router }: CommandActionContext) => {
								router.push({
									name: 'deployments-provider-runs',
									params: { provider: provider.provider, projectId: project.id },
								});
							},
						})),
					)
				: []),
			...(canManageSettings
				? visibleProviders.map((provider) => ({
						id: `deployment-settings:${provider.provider}`,
						name: `${formatTitle(provider.provider)} Settings`,
						icon: 'settings',
						group,
						keywords: ['deployments', 'settings', provider.provider],
						priority: 15,
						action: ({ router }: CommandActionContext) => {
							router.push({
								name: 'deployments-provider-settings',
								params: { provider: provider.provider },
							});
						},
					}))
				: []),
		];
	},
});

function canReadDeployments(stores: ReturnType<typeof useStores>) {
	const router = getDirectusRouter();

	return Boolean(
		router?.hasRoute('deployments-provider-dashboard')
		&& router.hasRoute('deployments-provider-settings')
		&& router.hasRoute('deployments-provider-runs')
		&& isModuleEnabled(stores, 'deployments')
		&& stores.usePermissionsStore().hasPermission('directus_deployments', 'read'),
	);
}

function canManageDeploymentSettings(permissionsStore: any) {
	return (
		permissionsStore.hasPermission('directus_deployments', 'update')
		|| permissionsStore.hasPermission('directus_deployments', 'delete')
		|| permissionsStore.hasPermission('directus_deployment_projects', 'create')
		|| permissionsStore.hasPermission('directus_deployment_projects', 'delete')
	);
}
