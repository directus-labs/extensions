import { capitalize } from 'lodash';

export function translateShortcut(keys: string[]): string {
	const isMac = navigator.platform.toLowerCase().startsWith('mac') || navigator.platform.startsWith('iP');

	return isMac
		? keys
				.map((key) => {
					if (key === 'meta')
						return '⌘';
					if (key === 'option')
						return '⌥';
					if (key === 'shift')
						return '⇧';
					if (key === 'alt')
						return '⌥';
					return capitalize(key);
				})
				.join('')
		: keys
				.map((key) => {
					if (key === 'meta')
						return 'Ctrl';
					return capitalize(key);
				})
				.join('+');
}
