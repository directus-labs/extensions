import { computed, type ComputedRef, type MaybeRef, unref } from 'vue';
// CORE CHANGES
// import { useServerStore } from "@/stores/server";

export function usePageSize<T = any>(
	availableSizes: MaybeRef<number[]>,
	mapCallback: (value: number, index: number, array: number[]) => T,
	defaultSize = 25,
	// CORE CHANGE
	system: Record<string, any>,
): { sizes: ComputedRef<T[]>; selected: number } {
	// CORE CHANGES
	const { useServerStore } = system.stores;

	const {
		info: { queryLimit },
	} = useServerStore();

	const pageSizes = computed<T[]>(() => {
		if (queryLimit === undefined || queryLimit.max === -1) {
			return unref(availableSizes).map(mapCallback);
		}

		const sizes = unref(availableSizes).filter(
			(size: number) => size <= queryLimit.max,
		);

		if (sizes.length === 0) {
			sizes.push(queryLimit.max);
		}

		return sizes.map(mapCallback);
	});

	const initialSize
        = queryLimit !== undefined ? Math.min(defaultSize, parseLimit(queryLimit.max)) : defaultSize;

	return {
		sizes: pageSizes,
		selected: initialSize,
	};
}

function parseLimit(value: number | undefined) {
	if (value === undefined || value === -1) {
		return Infinity;
	}

	return value;
}
