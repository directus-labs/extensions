import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import { themeColors } from '../constants';
import { AwarenessColor } from '../types';

const colors = Object.keys(themeColors) as AwarenessColor[];

export function useColor() {
	const storedColor = useLocalStorage<AwarenessColor>(
		'collab-user-color',
		colors[Math.floor(Math.random() * colors.length)] as AwarenessColor,
	);

	return computed(() => {
		if (colors.includes(storedColor.value as AwarenessColor)) {
			return storedColor.value;
		}
		// If color is invalid, generate a new random one and store it
		const newColor = colors[Math.floor(Math.random() * colors.length)];
		storedColor.value = newColor;
		return newColor;
	});
}
