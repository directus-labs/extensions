import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
    id: "directus-labs-experimental-m2a-interface",
    name: "Builder (M2A) Button Matrix",
    icon: "grid_view",
    description: "Add a matrix button selector to the built-in M2A interface",
    component: InterfaceComponent,
    types: ["alias"],
    localTypes: ["presentation"],
    group: "presentation",
    options: [
        {
            field: "target",
            name: "Target Builder (M2A) field placement",
            type: "string",
            meta: {
                width: "full",
                interface: "select-dropdown",
                options: {
                    choices: [
                        {
                            text: "Above this field",
                            value: "above",
                            icon: "vertical_align_top",
                        },
                        {
                            text: "Below this field",
                            value: "below",
                            icon: "vertical_align_bottom",
                        },
                    ],
                },
            },
            schema: {
                default_value: "below",
            },
        },
    ],
});
