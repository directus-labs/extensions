import { ref } from "vue";
import { defineLayout } from "@directus/extensions-sdk";
import LayoutComponent from "./layout.vue";

export default defineLayout({
    id: "directus-labs-spreadsheet-layout",
    name: "Spreadsheet",
    icon: "table",
    component: LayoutComponent,
    slots: {
        options: () => null,
        sidebar: () => null,
        actions: () => null,
    },
    setup() {
        const name = ref("Spreadsheet");
        return { name };
    },
});
