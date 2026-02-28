import type { RestClient } from '@directus/sdk';
import type { DirectusError, PanelRaw } from '../../types/extension';
import type { Schema } from '../api';
import { createPanel, readPanels } from '@directus/sdk';

async function migratePanels({
	res,
	client,
	panels,
	selectedDashboards,
	dry_run = false,
}: {
	res: any;
	client: RestClient<Schema>;
	panels: PanelRaw[] | null;
	selectedDashboards?: string[];
	dry_run: boolean;
}): Promise<{ response: string; name: string } | DirectusError> {
	if (!panels) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No panels found' }] };
	}

	// Issue #014: Skip panels if dashboards were skipped (empty selection)
	if (selectedDashboards && selectedDashboards.length === 0) {
		res.write('* Panels skipped (dashboards empty selection)\r\n\r\n');
		return { response: 'Skipped', name: 'Panels' };
	}

	// Issue #014: Filter panels by selected dashboards
	let filteredByDashboard = panels;
	if (selectedDashboards && selectedDashboards.length > 0) {
		const selectedDashboardIds = new Set(selectedDashboards);
		filteredByDashboard = panels.filter((panel) => selectedDashboardIds.has(panel.dashboard));
		res.write(`* Filtering to ${filteredByDashboard.length} panels for selected dashboards (from ${panels.length})\r\n\r\n`);
	}

	if (filteredByDashboard.length === 0) {
		res.write('* No panels to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Panels' };
	}

	res.write(`* [Local] Found ${filteredByDashboard.length} panels\r\n\r\n`);

	try {
		// Fetch existing panels
		res.write('* [Remote] Fetching Existing Panels ...');

		const existingPanels = await client.request(readPanels({
			limit: -1,
		}));

		if (!existingPanels)
			return { name: 'Directus Error', status: 404, errors: [{ message: 'Issue Fetching Panels' }] };
		res.write('done\r\n\r\n');

		const existingPanelIds = new Set(existingPanels.map((panel) => panel.id));

		const panelsToCreate = filteredByDashboard.filter((panel) => {
			if (existingPanelIds.has(panel.id)) {
				return false;
			}

			return true;
		});

		res.write(panelsToCreate.length > 0 ? `* [Remote] Uploading ${panelsToCreate.length} ${panelsToCreate.length > 1 ? 'Panels' : 'Panel'} ` : '* No Panels to migrate\r\n\r\n');

		if (panelsToCreate.length > 0) {
			for (const panel of panelsToCreate) {
				res.write('.');
				if (!dry_run) {
					await client.request(createPanel(panel));
				}
			}

			res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
			res.write('* Panel Migration Complete\r\n\r\n');
		}

		return { response: 'Success', name: 'Panels' };
	}
	catch (error) {
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export default migratePanels;
