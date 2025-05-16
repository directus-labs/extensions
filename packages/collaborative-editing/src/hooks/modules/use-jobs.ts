const _state: { jobManager: ReturnType<typeof createJobs> | undefined } = {
	jobManager: undefined,
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
	if (_state.jobManager) return _state.jobManager;

	_state.jobManager = createJobs();

	return _state.jobManager;
}
