export function getDirectusApp() {
	// @ts-ignore
	return document.querySelector('#app')?.__vue_app__;
}

export function getDirectusAppProvides(app?: any) {
	return (app ?? getDirectusApp())._container._vnode.component.provides;
}
