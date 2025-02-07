export const searchControls = [
	{
		key: 'no_index',
		label: 'No Index',
		icon: 'visibility_off',
		tooltip: 'Prevents search engines from indexing this page',
	},
	{
		key: 'no_follow',
		label: 'No Follow',
		icon: 'link_off',
		tooltip: 'Prevents search engines from following links on this page',
	},
];

export const sitemapFields = [
	{
		key: 'change_frequency',
		label: 'Change Frequency',
		icon: 'update',
		tooltip: 'How frequently this page is likely to change',
		options: [
			{ text: 'Always', value: 'always' },
			{ text: 'Hourly', value: 'hourly' },
			{ text: 'Daily', value: 'daily' },
			{ text: 'Weekly', value: 'weekly' },
			{ text: 'Monthly', value: 'monthly' },
			{ text: 'Yearly', value: 'yearly' },
			{ text: 'Never', value: 'never' },
		],
	},
	{
		key: 'priority',
		label: 'Priority',
		icon: 'signal_cellular_alt',
		tooltip: 'Priority indicates the importance of this page relative to other pages (1.0 highest)',
		options: [
			{ text: 'Very High (1.0)', value: '1.0' },
			{ text: 'High (0.8)', value: '0.8' },
			{ text: 'Medium (0.5)', value: '0.5' },
			{ text: 'Low (0.3)', value: '0.3' },
			{ text: 'Very Low (0.1)', value: '0.1' },
		],
	},
];
