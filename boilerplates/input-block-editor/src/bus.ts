import { useEventBus } from '@vueuse/core';

interface Event {
	type: 'open-url';
	payload: string;
}

export function useBus() {
	const bus = useEventBus<Event>('editorjs');

	return bus;
}
