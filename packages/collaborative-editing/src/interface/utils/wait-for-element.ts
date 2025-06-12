export function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
	return new Promise((resolve) => {
		const element = document.querySelector(selector);
		if (element) {
			return resolve(element);
		}

		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) {
				observer.disconnect();
				resolve(element);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});

		// Timeout fallback
		setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, timeout);
	});
}
