import { useI18n } from 'vue-i18n';
import messages from './index';

let registered = false;

/**
 * The app shares its vue-i18n instance with extensions, so merging once makes the plugin's strings follow each user's language.
 */
export function useSeoI18n() {
	const i18n = useI18n();

	if (!registered) {
		for (const { language, translation } of messages) {
			i18n.mergeLocaleMessage(language, translation);
		}

		registered = true;
	}

	return i18n;
}
