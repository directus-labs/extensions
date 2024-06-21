export function getDirectusApp() {
  // @ts-ignore @TODO: not sure the best way to type this
  return document.getElementById('app')?.__vue_app__;
}
