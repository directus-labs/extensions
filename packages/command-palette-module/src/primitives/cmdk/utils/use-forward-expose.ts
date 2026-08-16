// Adapted from Radix Vue's useForwardExpose.

import type { ComponentPublicInstance } from 'vue';
import { getCurrentInstance } from 'vue';

export function useForwardExpose() {
	const instance = getCurrentInstance();
	if (!instance) throw new Error('useForwardExpose must run during component setup');

	let currentRef: Element | ComponentPublicInstance | null = null;
	const exposed: Record<string, any> = { ...instance.exposed };

	for (const key in instance.props) {
		Object.defineProperty(exposed, key, {
			enumerable: true,
			configurable: true,
			get: () => instance.props[key],
		});
	}

	Object.defineProperty(exposed, '$el', {
		enumerable: true,
		configurable: true,
		get: () => {
			if (currentRef instanceof Element) return currentRef;
			return currentRef?.$el ?? instance.vnode.el;
		},
	});

	instance.exposed = exposed;

	function forwardRef(value: Element | ComponentPublicInstance | null) {
		currentRef = value;
	}

	return { forwardRef };
}
