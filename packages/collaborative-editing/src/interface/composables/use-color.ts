import { useLocalStorage } from '@vueuse/core';

const colors = ['#6644FF', '#3399FF', '#2ECDA7', '#FFC23B', '#FFA439', '#E35169'];

export function useColor() {
	return useLocalStorage<string>('collab-user-color', colors[Math.floor(Math.random() * colors.length)] as string);
}
