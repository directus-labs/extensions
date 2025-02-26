import type { ComponentPublicInstance, Ref } from 'vue';
import { onMounted, onUnmounted, ref } from 'vue';

type ShortcutHandler = (event: KeyboardEvent, cancelNext: () => void) => any | boolean;

export const keyMap: Record<string, string> = {
	Control: 'meta',
	Command: 'meta',
};

export const systemKeys = ['meta', 'shift', 'alt', 'backspace', 'delete', 'tab', 'capslock', 'enter', 'home', 'end'];

const keysDown: Set<string> = new Set([]);
const handlers: Record<string, ShortcutHandler[]> = {};

document.body.addEventListener('keydown', (event: KeyboardEvent) => {
	if (event.repeat || !event.key)
		return;

	keysDown.add(mapKeys(event));
	callHandlers(event);
});

document.body.addEventListener('keyup', (event: KeyboardEvent) => {
	if (event.repeat || !event.key)
		return;
	keysDown.clear();
});

export function useShortcut(
	shortcuts: string | string[],
	handler: ShortcutHandler,
	reference: Ref<HTMLElement | undefined> | Ref<ComponentPublicInstance | undefined> = ref(
		document.body,
	) as Ref<HTMLElement>,
): void {
	const callback: ShortcutHandler = (event, cancelNext) => {
		if (!reference.value)
			return;
		const ref = reference.value instanceof HTMLElement ? reference.value : (reference.value.$el as HTMLElement);

		if (
			document.activeElement === ref
			|| ref.contains(document.activeElement)
			|| document.activeElement === document.body
		) {
			event.preventDefault();
			return handler(event, cancelNext);
		}

		return false;
	};

	onMounted(() => {
		for (const shortcut of [shortcuts].flat()) {
			if (shortcut in handlers) {
				handlers[shortcut]?.unshift(callback);
			}
			else {
				handlers[shortcut] = [callback];
			}
		}
	});

	onUnmounted(() => {
		for (const shortcut of [shortcuts].flat()) {
			const shortcutHandler = handlers[shortcut];

			if (shortcutHandler) {
				const filteredHandlers = shortcutHandler.filter((f) => f !== callback);

				handlers[shortcut] = filteredHandlers;

				if (filteredHandlers.length === 0) {
					delete handlers[shortcut];
				}
			}
		}
	});
}

function mapKeys(key: KeyboardEvent) {
	const isLatinAlphabet = /^[a-z0-9]*$/gi;

	let keyString = key.key.match(isLatinAlphabet) === null ? key.code.replaceAll(/(Key|Digit)/g, '') : key.key;

	const keyStringInMap = keyMap[keyString];

	keyString = keyStringInMap ?? keyString;
	keyString = keyString.toLowerCase();

	return keyString;
}

function callHandlers(event: KeyboardEvent) {
	Object.entries(handlers).forEach(([key, value]) => {
		const keys = key.split('+');

		for (key of keysDown) {
			if (keys.includes(key) === false)
				return;
		}

		for (key of keys) {
			if (keysDown.has(key) === false)
				return;
		}

		for (const element of value) {
			let cancel = false;

			element?.(event, () => {
				cancel = true;
			});

			// if cancelNext is called, discontinue going through the queue.
			if (typeof cancel === 'boolean' && cancel)
				break;
		}
	});
}
