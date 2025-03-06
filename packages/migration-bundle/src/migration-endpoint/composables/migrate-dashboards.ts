import type { RestClient } from '@directus/sdk';
import type { DashboardRaw, DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { createDashboard, readDashboards } from '@directus/sdk';

async function migrateDashboards({ res, client, dashboards, dry_run = false }: { res: any; client: RestClient<Schema>; dashboards: DashboardRaw[] | null; dry_run: boolean }): Promise<{ response: string; name: string } | DirectusError> {
	if (!dashboards) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No dashboards found' }] };
	}
	else if (dashboards.length === 0) {
		res.write('* No dashboards to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Insights' };
	}

	res.write(`* [Local] Found ${dashboards.length} dashboards\r\n\r\n`);

	try {
		// Fetch existing dashboards
		res.write('* [Remote] Fetching Existing Dashboards ...');

		const existingDashboards = await client.request(readDashboards({
			limit: -1,
		}));

		if (!existingDashboards)
			return { name: 'Directus Error', status: 404, errors: [{ message: 'Issue Fetching Dashboards' }] };
		res.write('done\r\n\r\n');

		const existingDashboardIds = new Set(existingDashboards.map((dashboard) => dashboard.id));

		const filteredDashboards = dashboards.filter((dashboard) => {
			if (existingDashboardIds.has(dashboard.id)) {
				return false;
			}

			return true;
		}).map((dash) => {
			const newDash = { ...dash };
			delete newDash.panels;
			return newDash;
		});

		res.write(filteredDashboards.length > 0 ? `* [Remote] Uploading ${filteredDashboards.length} ${filteredDashboards.length > 1 ? 'Dashboards' : 'Dashboard'} ` : '* No Dashboards to migrate\r\n\r\n');

		if (filteredDashboards.length > 0) {
			await Promise.all(filteredDashboards.map(async (dashboard) => {
				res.write('.');
				await client.request(createDashboard(dashboard));
			}));

			res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
			res.write('* Dashboard Migration Complete\r\n\r\n');
		}

		return { response: 'Success', name: 'Insights' };
	}
	catch (error) {
		console.error(error);
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export default migrateDashboards;
