const _state: { rooms: ReturnType<typeof createJobs> | undefined } = {
	rooms: undefined,
};

function createJobs() {
	const jobs = new Map<string, NodeJS.Timeout>();

	function add(id: string, fn: () => void | Promise<void>, opts?: { delay: number }) {
		jobs.set(
			id,
			setTimeout(() => Promise.resolve(fn()).catch(), opts?.delay ?? 0),
		);
	}

	function cancel(id: string) {
		const jobId = jobs.get(id);
		if (jobId) {
			clearTimeout(jobId);
		}
	}

	return { add, cancel };
}

export function useJobs() {
	if (_state.rooms) return _state.rooms;

	_state.rooms = createJobs();

	return _state.rooms;
}
