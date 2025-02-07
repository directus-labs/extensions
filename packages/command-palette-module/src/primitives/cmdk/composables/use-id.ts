let lastId = 0;

export function useId() {
	return `cmd-${++lastId}`;
}
