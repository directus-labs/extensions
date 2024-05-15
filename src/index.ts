import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
    id: "directus-labs-video-interface",
    name: "Video",
    icon: "smart_display",
    description: "This is my custom interface!",
    component: InterfaceComponent,
    types: ["json"],
    group: "selection",
    options: null,
});
