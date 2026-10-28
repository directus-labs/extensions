export const searchControls = [
	{
		key: 'no_index',
		label: 'seo_plugin.fields.no_index',
		icon: 'visibility_off',
		tooltip: 'seo_plugin.tooltips.no_index',
	},
	{
		key: 'no_follow',
		label: 'seo_plugin.fields.no_follow',
		icon: 'link_off',
		tooltip: 'seo_plugin.tooltips.no_follow',
	},
];

export const sitemapFields = [
	{
		key: 'change_frequency',
		label: 'seo_plugin.fields.change_frequency',
		icon: 'update',
		tooltip: 'seo_plugin.tooltips.change_frequency',
		options: [
			{ text: 'seo_plugin.frequencies.always', value: 'always' },
			{ text: 'seo_plugin.frequencies.hourly', value: 'hourly' },
			{ text: 'seo_plugin.frequencies.daily', value: 'daily' },
			{ text: 'seo_plugin.frequencies.weekly', value: 'weekly' },
			{ text: 'seo_plugin.frequencies.monthly', value: 'monthly' },
			{ text: 'seo_plugin.frequencies.yearly', value: 'yearly' },
			{ text: 'seo_plugin.frequencies.never', value: 'never' },
		],
	},
	{
		key: 'priority',
		label: 'seo_plugin.fields.priority',
		icon: 'signal_cellular_alt',
		tooltip: 'seo_plugin.tooltips.priority',
		options: [
			{ text: 'seo_plugin.priorities.very_high', value: '1.0' },
			{ text: 'seo_plugin.priorities.high', value: '0.8' },
			{ text: 'seo_plugin.priorities.medium', value: '0.5' },
			{ text: 'seo_plugin.priorities.low', value: '0.3' },
			{ text: 'seo_plugin.priorities.very_low', value: '0.1' },
		],
	},
];
