export function displayTemplate(collection: string | null, display_template?: string | null) {
	switch (collection) {
		case 'directus_comments': {
			return '{{ comment }}';
		}
		case 'directus_roles':
		case 'directus_dashboards':
		case 'directus_policies':
		case 'directus_flows':
		case 'directus_operations': {
			return '{{ name }}';
		}
		case 'directus_panels': {
			return '{{ type }}';
		}
		case 'directus_activity': {
			return '{{ action }} ID:{{ item }} in {{ collection }}';
		}
		case 'directus_notifications': {
			return '{{ subject }}';
		}
		case 'directus_files': {
			return '{{ title }}';
		}
		case 'directus_presets': {
			return '{{ collection }} {{ bookmark }}';
		}
	// No default
	}

	return display_template;
}
