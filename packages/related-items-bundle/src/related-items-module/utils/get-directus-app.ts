export function getDirectusApp() {
	// @ts-expect-error __vue_app__ does not exist error
	return document.querySelector('#app')?.__vue_app__;
}
