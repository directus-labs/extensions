// find-border-element.ts
export function findBorderElement(fieldName: string, collection: string) {
	if (!fieldName || !collection) return null;

	const fieldEl = document.querySelector(`[data-field="${fieldName}"][data-collection="${collection}"]`);

	if (!fieldEl) return null;

	const interfaceImplEl = fieldEl.closest('.interface')?.firstElementChild;

	if (interfaceImplEl) return interfaceImplEl;

	// 	const tag = interfaceImplEl.tagName.toLowerCase();
	// 	const classes = new Set(Array.from(interfaceImplEl.classList));

	// 	if (classes.has('v-input')) {
	// 		return interfaceImplEl.firstElementChild;
	// 	}

	// 	if (classes.has('v-select')) {
	// 		return interfaceImplEl.querySelector('.v-input')?.firstElementChild;
	// 	}

	// 	if (classes.has('v-textarea') || classes.has('interface-input-rich-text-md')) {
	// 		return interfaceImplEl;
	// 	}

	return null;
}
