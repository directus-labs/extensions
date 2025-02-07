import type { Router } from "vue-router";
import { getDirectusApp } from "./get-directus-app";

export function getDirectusRouter(): Router {
    const app = getDirectusApp();
    return app?.config?.globalProperties?.$router;
}