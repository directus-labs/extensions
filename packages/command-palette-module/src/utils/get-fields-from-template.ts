export function getFieldsFromTemplate(template?: string | null): string[] {
	if (!template) return [];

	const fields = template.match(/\{\{(.*?)\}\}/g);
	if (!fields) return [];

	return fields.map((field) => field.replaceAll('{{', '').replaceAll('}}', '').trim());
}
