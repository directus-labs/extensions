import { getDirectusApp } from './get-directus-app';

export function getDirectusRouter() {
  const app = getDirectusApp();
  return app.config?.globalProperties?.$router;
}
