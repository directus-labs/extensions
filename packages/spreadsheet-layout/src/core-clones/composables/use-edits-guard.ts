import type { MaybeRef, Ref } from 'vue';
import type { LocationQuery } from 'vue-router';
import { isEqual } from 'lodash';
import { ref, unref } from 'vue';
import { useRoute } from 'vue-router';
import { useNavigationGuard } from './use-navigation-guard';

interface EditsGuardOptions {
	ignorePrefix?: MaybeRef<string>;
	compareQuery?: MaybeRef<string[]>;
}

export function useEditsGuard(hasEdits: Ref<boolean>, opts?: EditsGuardOptions) {
	const confirmLeave = ref(false);
	const leaveTo = ref<string | null>(null);

	useNavigationGuard(hasEdits, (to) => {
		const { path, query } = useRoute();

		if (
			hasEdits.value
			&& ((!isSubpath(path, to.path) && !isIgnoredPath(to.path)) || hasChangedQuery(query, to.query))
		) {
			confirmLeave.value = true;
			leaveTo.value = to.fullPath;
			return false;
		}
	});

	return { confirmLeave, leaveTo };

	function isSubpath(currentPath: string, newPath: string) {
		return (
			currentPath === newPath
			|| (newPath.startsWith(currentPath) && newPath.slice(currentPath.length).includes('/'))
		);
	}

	function isIgnoredPath(newPath: string) {
		const ignorePrefix = unref(opts?.ignorePrefix);

		if (!ignorePrefix)
			return false;

		return newPath.startsWith(ignorePrefix);
	}

	function hasChangedQuery(currentQuery: LocationQuery, newQuery: LocationQuery) {
		const compareQuery = unref(opts?.compareQuery);

		if (!compareQuery)
			return false;

		for (const query of compareQuery) {
			if (!isEqual(currentQuery[query], newQuery[query]))
				return true;
		}

		return false;
	}
}
