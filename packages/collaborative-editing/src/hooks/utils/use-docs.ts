import * as Y from 'yjs';

const _state: { docs: ReturnType<typeof createDocs> | undefined } = {
	docs: undefined,
};

function createDocs() {
	const docs = new Map<string, Y.Doc>();

	function add(name: string) {
		return docs.set(name, new Y.Doc());
	}

	function remove(name: string) {
		return docs.delete(name);
	}

	function get(name: string) {
		return docs.get(name);
	}

	function has(name: string) {
		return docs.has(name);
	}

	function update(name: string, payload: Uint8Array) {
		const doc = docs.get(name);
		if (doc) {
			Y.applyUpdate(doc, payload);
		}
	}

	return { add, remove, get, update, has };
}

export function useDocs() {
	if (_state.docs) return _state.docs;

	_state.docs = createDocs();

	return _state.docs;
}
