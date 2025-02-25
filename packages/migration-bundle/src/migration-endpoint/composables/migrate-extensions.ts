import type { RestClient } from '@directus/sdk';
import type { DirectusError, Extension } from '../../types/extension';
import type { Schema } from '../api';
import { customEndpoint, readExtensions } from '@directus/sdk';

async function installExtension(extension: any, client: any): Promise<void> {
	await client.request(customEndpoint({
		body: JSON.stringify({
			extension: extension.id,
			version: extension.version,
		}),
		method: 'POST',
		path: '/extensions/registry/install',
	}));
}

async function migrateExtensions({ res, client, extensions, dry_run = false }: { res: any; client: RestClient<Schema>; extensions: Extension[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!extensions) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No extensions found' }] };
	}
	else if (extensions.length === 0) {
		res.write('* No extensions to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Extensions' };
	}

	res.write(`* [Local] Found ${extensions.length} extensions\r\n\r\n`);

	try {
		const installedExtensions = await client.request(readExtensions());

		const registryExtensions = extensions.filter((ext) => ext.meta?.source === 'registry' && !ext.bundle);
		const bundles = [...new Set(extensions.filter((ext) => ext.bundle).map((ext) => ext.bundle))];
		const localExtensions = extensions.filter((ext) => ext.meta?.source === 'local');

		const extensionsToInstall = extensions.filter((ext) =>
			ext.meta?.source === 'registry'
			&& !ext.bundle
			&& !installedExtensions.some((installed) => 'id' in installed && installed.id === ext.id),
		);

		res.write(`* Found ${extensions.length} extensions total: ${registryExtensions.length} registry extensions (including ${bundles.length} bundles), and ${localExtensions.length} local extensions`);

		res.write(extensions.length > 0 ? `* [Remote] Installing ${extensions.length} ${extensions.length > 1 ? 'Extensions' : 'Extension'} ` : 'No Extensions to migrate\r\n\r\n');

		if (extensionsToInstall.length > 0) {
			const results = await Promise.allSettled(extensionsToInstall.map(async (ext) => {
				try {
					if (!dry_run) {
						await installExtension({
							id: ext.id,
							// The extension version UUID is the folder name
							version: ext.meta?.folder,
						}, client);

						return `-- Installed ${ext.schema?.name}`;
					}
					else {
						return `-- Skipped ${ext.schema?.name}`;
					}
				}
				catch (error) {
					console.error(error);
					return `-- Failed to install ${ext.schema?.name}`;
				}
			}));

			for (const result of results) {
				if (result.status === 'fulfilled') {
					res.write(`${result.value}\r\n\r\n`);
				}
			}

			res.write('* Finished installing extensions\r\n\r\n');
		}
		else {
			// All extensions are already installed
			res.write('* All extensions are already installed\r\n\r\n');
		}

		if (localExtensions.length > 0) {
			res.write(`* Note: ${localExtensions.length} local extensions need to be installed manually:\r\n\r\n`);

			localExtensions.forEach((ext) => {
				if ('name' in ext.schema) {
					res.write(`    * ${ext.schema.name}\r\n\r\n`);
				}
			});
		}

		res.write('* Extension Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Extensions' };
	}
	catch {
		res.write('* No extensions found or extensions file is empty. Skipping extension installation.\r\n\r\n');
		return { response: 'Skipped', name: 'Extensions' };
	}
}

export default migrateExtensions;
