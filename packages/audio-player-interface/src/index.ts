import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
    id: "directus-labs-audio-interface",
    name: "Audio",
    icon: "play_circle",
    description:
        "An interface to select an audio source and display an audio player from an URL or a local file from Directus.",
    component: InterfaceComponent,
    types: ["json"],
    group: "selection",
    options: null,
});
