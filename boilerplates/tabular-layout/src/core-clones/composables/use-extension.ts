import type {
	AppExtensionConfigs,
	AppExtensionType,
	HybridExtensionType,
} from '@directus/extensions';
import type { Plural } from '@directus/types';
import type { Ref } from 'vue';
import { pluralize } from '@directus/utils';
import { computed, unref } from 'vue';

export function useExtension<T extends AppExtensionType | HybridExtensionType>(
	type: T | Ref<T>,
	name: string | Ref<string | null>,
	// CORE CHANGE
	extensions: Record<string, any>,
): Ref<AppExtensionConfigs[Plural<T>][number] | null> {
	return computed(() => {
		if (unref(name) === null)
			return null;
		return (
			(extensions[pluralize(unref(type))].value as any[]).find(
				({ id }) => id === unref(name),
			) ?? null
		);
	});
}
