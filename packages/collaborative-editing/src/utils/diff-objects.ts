import type { Item } from '@directus/types';

export function diffObjects(initialData: Record<string, any>, newData: Item) {
	const changes = [];

	// Helper function to compare arrays
	function arraysEqual(arr1, arr2) {
		if (arr1.length !== arr2.length) return false;

		for (const [i, element] of arr1.entries()) {
			if (element !== arr2[i]) return false;
		}

		return true;
	}

	for (const key in initialData) {
		if (initialData.hasOwnProperty(key) && newData.hasOwnProperty(key)) {
			if (Array.isArray(initialData[key]) && Array.isArray(newData[key])) {
				if (!arraysEqual(initialData[key], newData[key])) {
					changes.push({
						field: key,
						oldValue: initialData[key],
						newValue: newData[key],
					});
				}
			}
			else if (initialData[key] !== newData[key]) {
				changes.push({
					field: key,
					oldValue: initialData[key],
					newValue: newData[key],
				});
			}
		}
	}

	return changes;
}
