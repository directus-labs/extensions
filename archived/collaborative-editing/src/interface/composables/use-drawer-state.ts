import { ref, onMounted, onUnmounted } from 'vue';

export function useDrawerState() {
	const isDrawerOpen = ref(false);
	let observer: MutationObserver | null = null;

	function checkDrawerState() {
		const drawer = document.querySelector('.v-drawer');
		isDrawerOpen.value = !!drawer;
	}

	onMounted(() => {
		// Initial check
		checkDrawerState();

		// Set up observer
		observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'childList') {
					checkDrawerState();
				}
			}
		});

		// Start observing the body for drawer changes
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});

	onUnmounted(() => {
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	});

	return {
		isDrawerOpen,
	};
}
